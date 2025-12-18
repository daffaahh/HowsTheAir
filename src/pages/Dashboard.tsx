import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Typography } from 'antd';
import { LikeOutlined, WarningOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { airQualityService } from '../services/airQualityService';
import type { AirQuality } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const { Title } = Typography;

// Warna untuk Pie Chart (Sesuai kategori AQI standar)
const COLORS: Record<string, string> = {
  'Good': '#52c41a', // Hijau
  'Moderate': '#faad14', // Kuning/Oranye
  'Unhealthy for Sensitive Groups': '#fa8c16', // Oranye tua
  'Unhealthy': '#f5222d', // Merah
  'Very Unhealthy': '#722ed1', // Ungu
  'Hazardous': '#8c8c8c', // Abu-abu/Hitam
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<AirQuality[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Data Chart
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [barData, setBarData] = useState<{ date: string; avgAqi: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await airQualityService.getAll();
      setData(result);
      processChartData(result);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC AGREGASI DATA (Client Side) ---
  const processChartData = (rawData: AirQuality[]) => {
    // 1. Siapkan Data Pie Chart (Group by Category)
    const categoryCount: Record<string, number> = {};
    rawData.forEach(item => {
      // Handle jika kategori null/undefined, masukkan ke 'Unknown'
      const cat = item.category || 'Unknown';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const processedPie = Object.keys(categoryCount).map(key => ({
      name: key,
      value: categoryCount[key],
    }));
    setPieData(processedPie);

    // 2. Siapkan Data Bar Chart (Group by Date -> Hitung Average AQI)
    // Kita ambil 7-14 hari terakhir saja biar grafik tetap rapi
    const dateGroups: Record<string, { total: number; count: number }> = {};
    
    rawData.forEach(item => {
      // Format tanggal jadi "YYYY-MM-DD" buat grouping yang akurat
      const dateKey = format(new Date(item.recordedAt), 'yyyy-MM-dd');
      
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = { total: 0, count: 0 };
      }
      dateGroups[dateKey].total += item.aqi;
      dateGroups[dateKey].count += 1;
    });

    // Convert ke Array & Sort berdasarkan tanggal
    const processedBar = Object.keys(dateGroups)
      .sort() // Urutkan tanggal dari lama ke baru
      .slice(-14) // Ambil 14 hari terakhir
      .map(date => ({
        // Format cantik buat label sumbu X (misal: "18 Des")
        date: format(new Date(date), 'dd MMM', { locale: id }), 
        avgAqi: Math.round(dateGroups[date].total / dateGroups[date].count),
      }));

    setBarData(processedBar);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100 }}>
        <Spin size="large" tip="Memuat Data Dashboard..." />
      </div>
    );
  }

  // Hitung Summary Cepat untuk Cards
  const totalData = data.length;
  // Hitung unik nama stasiun/kota
  const uniqueCities = new Set(data.map(d => d.stationName)).size;
  // Rata-rata AQI seluruh data
  const avgAqiOverall = Math.round(data.reduce((acc, curr) => acc + curr.aqi, 0) / (totalData || 1));

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Dashboard Kualitas Udara</Title>

      {/* --- SECTION 1: Summary Cards --- */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm">
            <Statistic 
              title="Total Data History" 
              value={totalData} 
              prefix={<LikeOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm">
            <Statistic 
              title="Kota / Stasiun Dipantau" 
              value={uniqueCities} 
              prefix={<EnvironmentOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm">
            <Statistic 
              title="Rata-rata AQI (Nasional)" 
              value={avgAqiOverall} 
              valueStyle={{ color: avgAqiOverall > 100 ? '#cf1322' : '#3f8600' }}
              prefix={<WarningOutlined />} 
              suffix={avgAqiOverall > 100 ? '/ Unhealthy' : '/ Good'}
            />
          </Card>
        </Col>
      </Row>

      {/* --- SECTION 2: Charts --- */}
      <Row gutter={24}>
        {/* Column Chart (Trend Harian) */}
        <Col xs={24} lg={14} style={{ marginBottom: 24 }}>
          <Card title="Tren Rata-rata AQI (14 Hari Terakhir)" bordered={false} className="shadow-sm">
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

        {/* Pie Chart (Distribusi Kategori) */}
        <Col xs={24} lg={10} style={{ marginBottom: 24 }}>
          <Card title="Distribusi Kategori Polusi" bordered={false} className="shadow-sm">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                    <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    // FIX: Tambahkan (percent || 0) supaya aman
                    label={({ name, percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    >
                    {/* Mapping warna berdasarkan nama kategori */}
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