import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Modal, Form, Input, message, Switch, Typography, Tag, Space } from 'antd';
import { PlusOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { citiesService } from '../services/citiesService';
import type { MonitoredCity, CreateCityDto } from '../types';

const { Title, Text } = Typography;

const Cities: React.FC = () => {
  const [cities, setCities] = useState<MonitoredCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form Instance
  const [form] = Form.useForm();

  // 1. Fetch Data
  const fetchCities = async () => {
    setLoading(true);
    try {
      const data = await citiesService.getAll();
      setCities(data);
    } catch (error) {
      message.error('Gagal memuat data kota.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // 2. Handle Submit (Tambah Kota)
  const handleCreate = async (values: CreateCityDto) => {
    setSubmitting(true);
    try {
      // Backend kita pintar: dia akan auto-detect nama asli dari API
      // Jadi user input nama bebas pun nanti dikoreksi BE.
      await citiesService.create(values);
      message.success('Kota berhasil ditambahkan!');
      setIsModalOpen(false);
      form.resetFields();
      fetchCities(); // Refresh table
    } catch (error: any) {
      // Tampilkan pesan error dari Backend (misal: Keyword salah)
      message.error(error.response?.data?.message || 'Gagal menambah kota.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Handle Toggle Switch
  const handleToggle = async (checked: boolean, id: number) => {
    try {
      await citiesService.toggleActive(id);
      message.success(`Status kota berhasil diubah.`);
      // Update state lokal biar UI cepet (Optimistic UI simple)
      setCities(prev => prev.map(city => city.id === id ? { ...city, isActive: checked } : city));
    } catch (error) {
      message.error('Gagal mengubah status.');
    }
  };

  const columns: ColumnsType<MonitoredCity> = [
    {
      title: 'Nama Kota (API)',
      dataIndex: 'stationName',
      key: 'stationName',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Keyword / Slug',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Status Monitoring',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active, record) => (
        <Switch 
          checked={active} 
          onChange={(checked) => handleToggle(checked, record.id)} 
          checkedChildren="Aktif"
          unCheckedChildren="Off"
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Master Kota</Title>
          <Text type="secondary">Kelola daftar kota yang ingin dipantau kualitas udaranya.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Tambah Kota
        </Button>
      </div>

      <Card bordered={false} className="shadow-sm">
        <Table 
          columns={columns} 
          dataSource={cities} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* MODAL FORM TAMBAH KOTA */}
      <Modal
        title="Tambah Kota Baru"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null} // Kita pakai tombol submit di dalam Form
      >
        <Form layout="vertical" form={form} onFinish={handleCreate}>
          <Form.Item
            label="Keyword / Slug (WAQI)"
            name="keyword"
            rules={[{ required: true, message: 'Masukkan keyword kota (contoh: tokyo / @1234)' }]}
            help="Gunakan slug kota (misal: 'london') atau UID stasiun (misal: '@8523') untuk hasil akurat."
          >
            <Input placeholder="Contoh: new-york" prefix={<EnvironmentOutlined />} />
          </Form.Item>

          <Form.Item
            label="Label Nama (Opsional)"
            name="stationName"
            initialValue="Checking..."
            hidden // Kita sembunyikan karena BE akan auto-detect nama
          >
            <Input />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Simpan & Validasi API
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Cities;