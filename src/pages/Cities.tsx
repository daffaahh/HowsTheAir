import React, { useEffect, useState } from 'react';
import { Table, Button, Card, message, Switch, Typography, Tag, Popconfirm, Input, Tooltip, Space, Modal, Form } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, QuestionCircleOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { citiesService } from '../services/citiesService';
import type { MonitoredCity } from '../types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import AddStationModal from '../components/AddStationModal';

const { Title, Text } = Typography;

const Cities: React.FC = () => {
  const [cities, setCities] = useState<MonitoredCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState(''); // State untuk filter lokal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<MonitoredCity | null>(null);
  const [editForm] = Form.useForm(); // Form instance untuk edit

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

  // 2. Handle Toggle
  const handleToggle = async (checked: boolean, id: number) => {
    try {
      // Optimistic Update
      setCities(prev => prev.map(city => city.id === id ? { ...city, isActive: checked } : city));
      await citiesService.toggleActive(id);
      message.success('Status berhasil diperbarui.');
    } catch (error) {
      message.error('Gagal update status.');
      fetchCities(); // Revert
    }
  };

  const handleEditClick = (record: MonitoredCity) => {
    setEditingCity(record);
    editForm.setFieldsValue({ keyword: record.keyword }); // Isi form dengan keyword lama
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      if (!editingCity) return;

      // Call API
      await citiesService.update(editingCity.id, { keyword: values.keyword });
      
      message.success('Keyword berhasil diperbarui!');
      
      // Update UI lokal
      setCities(prev => prev.map(c => c.id === editingCity.id ? { ...c, keyword: values.keyword } : c));
      
      setIsEditModalOpen(false);
      setEditingCity(null);
    } catch (error) {
      message.error('Gagal mengupdate keyword.');
    }
  };

  // 3. Handle Delete (NEW)
  const handleDelete = async (id: number) => {
    try {
      await citiesService.delete(id);
      message.success('Stasiun berhasil dihapus.');
      setCities(prev => prev.filter(city => city.id !== id)); // Hapus dari state
    } catch (error) {
      message.error('Gagal menghapus stasiun.');
    }
  };

  // Logic Filter Client-side
  const filteredData = cities.filter(city => {
    const term = searchText.toLowerCase();
    return (
      city.stationName.toLowerCase().includes(term) ||
      city.keyword.toLowerCase().includes(term)
    );
  });

  const columns: ColumnsType<MonitoredCity> = [
    {
      title: 'Nama Stasiun / Lokasi',
      dataIndex: 'stationName',
      key: 'stationName',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Tag & UID',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
            <Tag 
              color="blue" 
              style={{ cursor: 'pointer' }} 
              onClick={() => handleEditClick(record)} // Trigger Modal Edit
            >
              {text} <EditOutlined />
            </Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>UID: {record.uid}</Text> {/* UID WAQI */}
        </Space>
      ),
    },
    {
      title: 'Ditambahkan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      // Jika createdAt belum ada di interface FE, pastikan tambahkan opsional (?)
      render: (date) => date ? format(new Date(date), 'dd MMM yyyy', { locale: localeId }) : '-',
      sorter: (a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime(),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active, record) => (
        <Tooltip title={active ? "Stasiun ini dipantau" : "Pemantauan dimatikan sementara"}>
           <Switch 
            size="small"
            checked={active} 
            onChange={(checked) => handleToggle(checked, record.id)} 
          />
        </Tooltip>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="Hapus Stasiun?"
          description="Data history terkait stasiun ini juga akan hilang."
          onConfirm={() => handleDelete(record.id)}
          okText="Ya, Hapus"
          cancelText="Batal"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Master Stasiun</Title>
          <Text type="secondary">Kelola daftar target pemantauan kualitas udara.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Tambah Stasiun
        </Button>
      </div>

      {/* Toolbar & Table */}
      <Card bordered={false} className="shadow-sm">
        <div style={{ marginBottom: 16, maxWidth: 300 }}>
          <Input 
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
            placeholder="Cari nama stasiun atau tag..." 
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 5, showSizeChanger: true }}
        />
      </Card>
      <AddStationModal 
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchCities();
        }}
      />
      <Modal
        title="Ubah Keyword / Tag"
        open={isEditModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setIsEditModalOpen(false)}
        destroyOnClose
      ><Form form={editForm} layout="vertical">
          <Form.Item
            label="Keyword Baru"
            name="keyword"
            rules={[{ required: true, message: 'Keyword tidak boleh kosong' }]}
          >
            <Input placeholder="Masukkan keyword baru" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Cities;