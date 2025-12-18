import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Typography, DatePicker } from 'antd'; // Tambah DatePicker
import { LikeOutlined, WarningOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { airQualityService } from '../services/airQualityService';
import type { AirQualityHistory } from '../types'; // Ganti tipe data ke History
import { format, subDays } from 'date-fns'; // Import subDays
import { id } from 'date-fns/locale';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Warna Chart (Sama seperti kodemu)
const COLORS: Record<string, string> = {
  'Good': '#52c41a',
  'Moderate': '#faad14',
  'Unhealthy for Sensitive Groups': '#fa8c16',
  'Unhealthy': '#f5222d',
  'Very Unhealthy': '#722ed1',
  'Hazardous': '#8c8c8c',
};

const Dashboard: React.FC = () => {
  // Ganti tipe state jadi AirQualityHistory
  const [historyData, setHistoryData] = useState<AirQualityHistory[]>([]); 
  const [loading, setLoading] = useState(true);

  // State Chart
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [barData, setBarData] = useState<{ date: string; avgAqi: number }[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      // PENTING: Ambil data dari endpoint HISTORY, bukan endpoint tabel snapshot
      const result = await airQualityService.getHistory();
      setHistoryData(result);
      processChartData(result);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (rawData: AirQualityHistory[]) => {
    // 1. Pie Chart Logic (Sama, tapi pakai data history)
    const categoryCount: Record<string, number> = {};
    rawData.forEach(item => {
      const cat = item.category || 'Unknown';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    setPieData(Object.keys(categoryCount).map(key => ({
      name: key,
      value: categoryCount[key],
    })));

    // 2. Bar Chart Logic (Agregasi Harian)
    const dateGroups: Record<string, { total: number; count: number }> = {};
    
    rawData.forEach(item => {
      // Format grouping harian
      const dateKey = format(new Date(item.recordedAt), 'yyyy-MM-dd');
      
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = { total: 0, count: 0 };
      }
      dateGroups[dateKey].total += item.aqi;
      dateGroups[dateKey].count += 1;
    });

    // Urutkan dan batasi 14 hari (atau sebulan sesuai request PDF)
    const processedBar = Object.keys(dateGroups)
      .sort() 
      // .slice(-30) // Bisa diganti 30 hari sesuai PDF page 2
      .map(date => ({
        date: format(new Date(date), 'dd MMM', { locale: id }), 
        avgAqi: Math.round(dateGroups[date].total / dateGroups[date].count),
      }));

    setBarData(processedBar);
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  // Kalkulasi Summary Card (Statistik)
  const totalRecords = historyData.length;
  // Hitung unik stasiun dari history (kalau backend kirim monitoredCity)
  // Atau hardcode ambil dari endpoint /cities terpisah jika data history polosan
  const uniqueStations = new Set(historyData.map(d => d.monitoredCityId)).size;
  
  const avgAqiAllTime = Math.round(
    historyData.reduce((acc, curr) => acc + curr.aqi, 0) / (totalRecords || 1)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Dashboard Analitik</Title>
        {/* Placeholder: Filter Tanggal (Sesuai PDF Page 2 Point 6) */}
        <RangePicker onChange={() => console.log('Filter date logic here')} />
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Total Data History" value={totalRecords} prefix={<LikeOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Stasiun Aktif" value={uniqueStations} prefix={<EnvironmentOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} className="shadow-sm">
            <Statistic 
              title="Rata-rata AQI (Historis)" 
              value={avgAqiAllTime} 
              valueStyle={{ color: avgAqiAllTime > 100 ? '#cf1322' : '#3f8600' }}
              prefix={<WarningOutlined />} 
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} lg={14} style={{ marginBottom: 24 }}>
          <Card title="Tren Rata-rata Kualitas Udara" bordered={false}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar name="Rata-rata AQI" dataKey="avgAqi" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Proporsi Kategori Pencemaran" bordered={false}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;