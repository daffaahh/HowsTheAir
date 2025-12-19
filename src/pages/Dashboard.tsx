import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Typography, DatePicker, Empty, Space } from 'antd';
import { LikeOutlined, WarningOutlined, EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { airQualityService } from '../services/airQualityService';
import type { AirQualityHistory } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// --- KONFIGURASI WARNA CHART ---
const COLORS: Record<string, string> = {
  'Good': '#52c41a', 
  'Moderate': '#faad14', 
  'Unhealthy for Sensitive Groups': '#fa8c16', 
  'Unhealthy': '#f5222d', 
  'Very Unhealthy': '#722ed1', 
  'Hazardous': '#8c8c8c', 
  'Unknown': '#d9d9d9'
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<AirQualityHistory[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State Data Chart yang sudah diolah
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [barData, setBarData] = useState<{ date: string; avgAqi: number }[]>([]);

  // --- 1. FETCH HISTORY ---
  // Menerima parameter dates (tuple [start, end])
  const fetchHistory = async (dates?: [string, string]) => {
    setLoading(true);
    try {
      // Jika dates ada, kirim object params. Jika tidak, backend handle default (30 hari).
      const params = dates ? { startDate: dates[0], endDate: dates[1] } : undefined;
      const result = await airQualityService.getHistory(params);
      
      setData(result);
      processChartData(result);
    } catch (error) {
      console.error('Gagal mengambil data dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(); // Load default (30 hari terakhir) saat mount
  }, []);

  // --- 2. LOGIC AGREGASI DATA (Client Side Processing) ---
  const processChartData = (rawData: AirQualityHistory[]) => {
    if (rawData.length === 0) {
      setPieData([]);
      setBarData([]);
      return;
    }

    // A. Pie Chart: Group by Category
    const categoryCount: Record<string, number> = {};
    rawData.forEach(item => {
      const cat = item.category || 'Unknown';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    setPieData(Object.keys(categoryCount).map(key => ({
      name: key,
      value: categoryCount[key],
    })));

    // B. Bar Chart: Group by Date (Rata-rata AQI Harian)
    const dateGroups: Record<string, { total: number; count: number }> = {};
    
    rawData.forEach(item => {
      // Format grouping: YYYY-MM-DD
      const dateKey = format(new Date(item.recordedAt), 'yyyy-MM-dd');
      
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = { total: 0, count: 0 };
      }
      dateGroups[dateKey].total += item.aqi;
      dateGroups[dateKey].count += 1;
    });

    // Convert ke Array, Sort Date Ascending, dan Format Label
    const processedBar = Object.keys(dateGroups)
      .sort() // Sort string ISO (yyyy-mm-dd) aman
      .map(dateStr => ({
        // Label sumbu X: "18 Des"
        date: format(new Date(dateStr), 'dd MMM', { locale: id }), 
        avgAqi: Math.round(dateGroups[dateStr].total / dateGroups[dateStr].count),
      }));

    setBarData(processedBar);
  };

  // --- 3. HANDLER FILTER TANGGAL ---
  const onDateChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      // dateStrings dari AntD sudah format string "YYYY-MM-DD"
      fetchHistory(dateStrings);
    } else {
      // User clear filter -> Reset ke default
      fetchHistory(); 
    }
  };

  // --- 4. SUMMARY CARD CALCULATION ---
  const totalRecords = data.length;
  // Hitung jumlah stasiun unik yang ada di history ini
  const uniqueStations = new Set(data.map(d => d.monitoredCityId)).size;
  // Rata-rata AQI total (Weighted Average sederhana)
  const avgAqiAll = totalRecords > 0 
    ? Math.round(data.reduce((acc, cur) => acc + cur.aqi, 0) / totalRecords) 
    : 0;

  return (
    <div>
      {/* HEADER & FILTER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Dashboard Analitik</Title>
          <Text type="secondary">Visualisasi tren kualitas udara historis.</Text>
        </div>
        
        <Space>
           <CalendarOutlined style={{ fontSize: 18, color: '#1890ff' }} />
           <RangePicker 
             onChange={onDateChange} 
             style={{ width: 280 }}
             placeholder={['Mulai Tanggal', 'Sampai Tanggal']}
           />
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" tip="Memuat Analitik..." />
        </div>
      ) : data.length === 0 ? (
        <Empty description="Tidak ada data history pada rentang tanggal ini." style={{ margin: '100px 0' }} />
      ) : (
        <>
          {/* SECTION 1: STATISTIK CARDS */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="shadow-sm">
                <Statistic 
                  title="Total Data Sampel" 
                  value={totalRecords} 
                  prefix={<LikeOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="shadow-sm">
                <Statistic 
                  title="Stasiun Berkontribusi" 
                  value={uniqueStations} 
                  prefix={<EnvironmentOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="shadow-sm">
                <Statistic 
                  title="Rata-rata AQI (Periode Ini)" 
                  value={avgAqiAll} 
                  valueStyle={{ color: avgAqiAll > 100 ? '#cf1322' : '#3f8600' }}
                  prefix={<WarningOutlined />} 
                  suffix={avgAqiAll > 100 ? 'Unhealthy' : 'Good'}
                />
              </Card>
            </Col>
          </Row>

          {/* SECTION 2: CHARTS */}
          <Row gutter={[24, 24]}>
            
            {/* COLUMN CHART: TREND HARIAN */}
            <Col xs={24} lg={14}>
              <Card title="Tren Rata-rata Kualitas Udara (Harian)" bordered={false} className="shadow-sm">
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: 8 }} 
                        // FIX: Izinkan value berupa undefined, lalu pakai (value ?? 0) untuk display
                        formatter={(value: number | undefined) => [
                          `${value ?? 0} AQI`, 
                          'Rata-rata'
                        ]}
                      />
                      <Legend />
                      <Bar 
                        name="Rata-rata AQI" 
                        dataKey="avgAqi" 
                        fill="#1890ff" 
                        radius={[4, 4, 0, 0]} 
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

            {/* PIE CHART: DISTRIBUSI KATEGORI */}
            <Col xs={24} lg={10}>
              <Card title="Proporsi Kategori Pencemaran" bordered={false} className="shadow-sm">
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60} // Donut style agar terlihat modern
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        // Nullish coalescing agar aman dari undefined
                        label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS['Unknown']} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;