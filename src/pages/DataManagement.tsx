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
  
  // Ref biar ga double fetch di React.StrictMode (Development mode)
  const isMounted = useRef(false);

// --- 1. FETCH DATA (Updated) ---
  const fetchData = async (searchQuery = searchText) => {
    setLoading(true);
    try {
      const result = await airQualityService.getAll({ 
        search: searchQuery 
        // Nanti bisa tambah startDate/endDate disini juga
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

  // --- 2. LOGIC SYNC ---
  const handleSync = async (isAuto = false) => {
    setSyncing(true);
    try {
      const res = await airQualityService.sync();
      
      // Kalo auto sync, ga perlu notif heboh, cukup update data
      if (!isAuto) {
         message.success(`Sync Selesai! ${res.syncedCount} data terupdate.`);
      } else if (res.syncedCount > 0) {
         // Opsional: Kasih tau user kalo ada data baru masuk pas dia buka page
         message.info('Data terbaru berhasil dimuat.');
      }

      fetchData(); // Refresh tabel setelah sync selesai
    } catch (error) {
      if (!isAuto) message.error('Gagal sinkronisasi.');
    } finally {
      setSyncing(false);
    }
  };

  // --- 3. SMART INIT (Fetch + Auto Sync Check) ---
  useEffect(() => {
    const initPage = async () => {
      setLoading(true); // Loading awal tabel
      const log = await fetchData(); // 1. Ambil data DB dulu
      setLoading(false); // Tampilkan data DB segera

      // 2. Cek apakah perlu Auto-Sync?
      // Logic: Jika belum pernah sync ATAU sync terakhir > 15 menit yang lalu
      if (log) {
        const lastSyncDate = new Date(log.performedAt);
        const now = new Date();
        const diff = differenceInMinutes(now, lastSyncDate);

        if (diff > 15) { 
          // console.log(`Data stale (${diff} min). Auto-syncing...`);
          handleSync(true); // Jalankan sync mode 'silent' / auto
        } else {
          // console.log(`Data fresh (${diff} min). No sync needed.`);
        }
      } else {
        // Belum pernah sync sama sekali -> Auto Sync
        handleSync(true);
      }
    };

    if (!isMounted.current) {
        initPage();
        isMounted.current = true;
    }
  }, []); // Run sekali pas mount

  // --- HANDLER SEARCH ---
    const onSearch = (value: string) => {
      setSearchText(value); // Update state
      fetchData(value);     // Langsung fetch dengan query baru
    };

  // --- 3. KONFIGURASI KOLOM TABEL ---
  const columns: ColumnsType<AirQuality> = [
    {
      title: 'Keyword',
      key: 'keyword',
      width: 150, // Opsional: atur lebar biar rapi
      render: (_, record) => {
        const text = record.monitoredCity?.keyword || '-';
        // Visual: Biru untuk keyword biasa
        return <Tag color="blue">{text}</Tag>;
      },
      sorter: (a, b) => 
        (a.monitoredCity?.keyword || '').localeCompare(b.monitoredCity?.keyword || ''),

      // Update logic filter untuk nested object
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
      // Mengambil data dari nested object 'monitoredCity'
      render: (_, record) => record.monitoredCity?.stationName || 'N/A',
      
      // Update logic sorting untuk nested object
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
            // --- PERBAIKAN DI SINI ---
            // Jangan onClick={handleSync}
            // Ganti jadi arrow function biar argumennya jelas
            onClick={() => handleSync(false)} 
            // -------------------------
            loading={syncing}
            size="large"
          >
            {syncing ? 'Syncing...' : 'Sync Data Now'}
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card bordered={false} className="shadow-sm">

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          
          {/* SEARCH BAR BARU */}
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