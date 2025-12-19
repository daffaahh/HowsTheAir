import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Card, Tag, message, Space, Typography, Tooltip, Input } from 'antd';
import { SyncOutlined, ReloadOutlined, HistoryOutlined, SearchOutlined  } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { airQualityService } from '../services/airQualityService'; // Pastikan path import benar
import { format, differenceInMinutes } from 'date-fns';
import { id } from 'date-fns/locale';
import type { AirQuality, AuditLog } from '../types';



const { Title, Text } = Typography;

const DataManagement: React.FC = () => {
const [data, setData] = useState<AirQuality[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<AuditLog | null>(null);
  const [searchText, setSearchText] = useState('');
  
  const isMounted = useRef(false);

  const fetchData = async (searchQuery = searchText) => {
    setLoading(true);
    try {
      const result = await airQualityService.getAll({ 
        search: searchQuery 
      });
      setData(result);
      
      const log = await airQualityService.getLastSync();
      setLastSync(log);
      return log;
    } catch (error) {
      message.error('Gagal mengambil data.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (isAuto = false) => {
    setSyncing(true);
    try {
      const res = await airQualityService.sync();
      
      if (!isAuto) {
         message.success(`Sync Selesai! ${res.syncedCount} data terupdate.`);
      } else if (res.syncedCount > 0) {
         message.info('Data terbaru berhasil dimuat.');
      }

      fetchData(); // Refresh tabel setelah sync selesai
    } catch (error) {
      if (!isAuto) message.error('Gagal sinkronisasi.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true); 
      const log = await fetchData();
      setLoading(false); 

      if (log) {
        const lastSyncDate = new Date(log.performedAt);
        const now = new Date();
        const diff = differenceInMinutes(now, lastSyncDate);

        if (diff > 15) { 
          handleSync(true); 
        } else {
        }
      } else {
        handleSync(true);
      }
    };

    if (!isMounted.current) {
        initPage();
        isMounted.current = true;
    }
  }, []);

    const onSearch = (value: string) => {
      setSearchText(value); 
      fetchData(value);     
    };

  const columns: ColumnsType<AirQuality> = [
    {
      title: 'Keyword',
      key: 'keyword',
      width: 150,
      render: (_, record) => {
        const text = record.monitoredCity?.keyword || '-';
        return <Tag color="blue">{text}</Tag>;
      },
      sorter: (a, b) => 
        (a.monitoredCity?.keyword || '').localeCompare(b.monitoredCity?.keyword || ''),

      filters: Array.from(new Set(data.map(item => item.monitoredCity?.keyword)))
        .filter(Boolean) // Hapus yang null/undefined
        .map(name => ({
          text: name,
          value: name as string,
        })),
      onFilter: (value, record) => 
        record.monitoredCity?.keyword?.includes(value as string) || false,
    },
    {
      title: 'Nama Stasiun',
      key: 'stationName',
      render: (_, record) => record.monitoredCity?.stationName || 'N/A',
      
      sorter: (a, b) => {
        const nameA = a.monitoredCity?.stationName || '';
        const nameB = b.monitoredCity?.stationName || '';
        return nameA.localeCompare(nameB);
      },
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
          {lastSync && (
            <Tooltip title={`Detail: ${lastSync.details || '-'}`}>
               <Tag icon={<HistoryOutlined />} color="blue">
                  Last Sync: {format(new Date(lastSync.performedAt), 'dd MMM HH:mm', { locale: id })}
               </Tag>
            </Tooltip>
          )}

          <Button 
            type="primary" 
            icon={<SyncOutlined spin={syncing} />} 
            onClick={() => handleSync(false)} 
            loading={syncing}
            size="large"
          >
            {syncing ? 'Syncing...' : 'Sync Data Now'}
          </Button>
        </Space>
      </div>

      <Card bordered={false} className="shadow-sm">

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          
          <Input.Search
            placeholder="Cari Keyword, Kota, atau Kategori..."
            allowClear
            enterButton={<Button icon={<SearchOutlined />}>Cari</Button>}
            size="large"
            onSearch={onSearch} // Trigger saat Enter atau klik tombol Cari
            style={{ maxWidth: 400 }}
          />

          <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
            Refresh Table
          </Button>
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