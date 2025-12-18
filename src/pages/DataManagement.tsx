import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Tag, message, Space, Typography, Tooltip } from 'antd';
import { SyncOutlined, ReloadOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { airQualityService } from '../services/airQualityService'; // Pastikan path import benar
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { AirQuality, AuditLog } from '../types';


const { Title, Text } = Typography;

const DataManagement: React.FC = () => {
  const [data, setData] = useState<AirQuality[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<AuditLog | null>(null);

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await airQualityService.getAll();
      setData(result);
      
      const log = await airQualityService.getLastSync();
      setLastSync(log);
    } catch (error) {
      message.error('Gagal mengambil data polusi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. HANDLE SYNC ---
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await airQualityService.sync();
      message.success(`Sync Selesai! ${res.syncedCount} stasiun terupdate.`);
      fetchData(); 
    } catch (error) {
      message.error('Gagal melakukan sinkronisasi.');
    } finally {
      setSyncing(false);
    }
  };

  // --- 3. KONFIGURASI KOLOM TABEL ---
  const columns: ColumnsType<AirQuality> = [
    {
      title: 'Nama Stasiun / Kota',
      key: 'stationName',
      // Mengambil data dari nested object 'monitoredCity'
      render: (_, record) => record.monitoredCity?.stationName || 'N/A',
      
      // Update logic sorting untuk nested object
      sorter: (a, b) => {
        const nameA = a.monitoredCity?.stationName || '';
        const nameB = b.monitoredCity?.stationName || '';
        return nameA.localeCompare(nameB);
      },

      // Update logic filter untuk nested object
      filters: Array.from(new Set(data.map(item => item.monitoredCity?.stationName)))
        .filter(Boolean) // Hapus yang null/undefined
        .map(name => ({
          text: name,
          value: name as string,
        })),
      onFilter: (value, record) => 
        record.monitoredCity?.stationName?.includes(value as string) || false,
    },
    {
      title: 'AQI',
      dataIndex: 'aqi',
      key: 'aqi',
      sorter: (a, b) => a.aqi - b.aqi,
      render: (aqi) => {
        let color = 'green';
        if (aqi > 50) color = 'gold';
        if (aqi > 100) color = 'orange';
        if (aqi > 150) color = 'volcano';
        if (aqi > 200) color = 'red';
        if (aqi > 300) color = 'purple';
        return <Tag color={color} style={{ fontWeight: 'bold' }}>{aqi}</Tag>;
      },
    },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Good', value: 'Good' },
        { text: 'Moderate', value: 'Moderate' },
        { text: 'Unhealthy', value: 'Unhealthy' },
        { text: 'Hazardous', value: 'Hazardous' },
      ],
      onFilter: (value, record) => record.category.indexOf(value as string) === 0,
    },
    {
      title: 'Waktu Data (Recorded)',
      dataIndex: 'recordedAt',
      key: 'recordedAt',
      defaultSortOrder: 'descend',
      sorter: (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      render: (date) => format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: id }),
    },
    {
      title: 'Terakhir Sync',
      dataIndex: 'lastSynced',
      key: 'lastSynced',
      render: (date) => <Text type="secondary" style={{ fontSize: '12px' }}>{format(new Date(date), 'dd/MM/yy HH:mm')}</Text>,
    },
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Data Polusi Udara</Title>
          <Text type="secondary">
            Memantau kualitas udara dari berbagai stasiun aktif.
          </Text>
        </div>
        
        <Space>
          {/* Info Last Sync */}
          {lastSync && (
            <Tooltip title={`Detail: ${lastSync.details || '-'}`}>
               <Tag icon={<HistoryOutlined />} color="blue">
                  Last Sync: {format(new Date(lastSync.performedAt), 'dd MMM HH:mm', { locale: id })}
               </Tag>
            </Tooltip>
          )}

          {/* Tombol Sync */}
          <Button 
            type="primary" 
            icon={<SyncOutlined spin={syncing} />} 
            onClick={handleSync}
            loading={syncing}
            size="large"
          >
            {syncing ? 'Syncing...' : 'Sync Data Now'}
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card bordered={false} className="shadow-sm">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
             <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh Table</Button>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id"
          loading={loading}
          pagination={{ 
            defaultPageSize: 10, 
            showSizeChanger: true, 
            pageSizeOptions: ['10', '20', '50', '100'] 
          }}
          scroll={{ x: 700 }}
        />
      </Card>
    </div>
  );
};

export default DataManagement;