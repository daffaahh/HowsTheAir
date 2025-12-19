import React, { useState, useMemo } from 'react';
import { Modal, Select, Form, message, Spin, Typography } from 'antd';
import { citiesService } from '../services/citiesService';
import { debounce } from 'lodash';
import type { SearchStation } from '../types';

const { Option } = Select;
const { Text } = Typography;

interface AddStationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AddStationModal: React.FC<AddStationModalProps> = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState<SearchStation[]>([]);
  const [fetching, setFetching] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  // State untuk menyimpan apa yang diketik user
  const [searchText, setSearchText] = useState('');

  // 1. Logic Search
  const fetchStation = async (value: string) => {
    if (!value) {
      setOptions([]);
      return;
    }
    setFetching(true);
    try {
      const result = await citiesService.search(value);
      setOptions(result); 
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const debouncedFetch = useMemo(() => debounce(fetchStation, 800), []);

  // Handler saat user ngetik
  const handleSearch = (val: string) => {
    setSearchText(val); // Simpan text input user ("bangalore")
    debouncedFetch(val);
  };

  // 2. Logic Submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);

      // values.uid berisi UID yang dipilih dari dropdown (value={opt.uid})
      const selectedStation = options.find(opt => opt.uid === values.uid);

      if (!selectedStation) {
         message.error('Data stasiun tidak valid.');
         return;
      }

      await citiesService.create({
        stationName: selectedStation.name, // Nama resmi dari API
        uid: selectedStation.uid,          // UID untuk teknis
        keyword: searchText,               // Text yang diketik user ("bangalore")
      });

      message.success('Stasiun berhasil ditambahkan!');
      form.resetFields();
      setOptions([]);
      setSearchText('');
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal menambahkan stasiun.');
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title="Tambah Stasiun Baru"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Cari & Pilih Stasiun"
          name="uid" // Yang kita ambil valuenya adalah UID
          rules={[{ required: true, message: 'Harap pilih stasiun' }]}
          help={`Tag yang akan disimpan: "${searchText || '-'}"`}
        >
          <Select
            showSearch
            placeholder="Ketik nama kota..."
            filterOption={false}
            onSearch={handleSearch} // Update state searchText disini
            notFoundContent={fetching ? <Spin size="small" /> : null}
            style={{ width: '100%' }}
            size="large"
            defaultActiveFirstOption={false}
          >
            {options.map((opt) => (
              // Value dropdown adalah UID
              <Option key={opt.uid} value={opt.uid}> 
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.name}
                  </span>
                  <Text type={Number(opt.aqi) > 100 ? 'danger' : 'success'} style={{ fontSize: 12 }}>
                     AQI: {opt.aqi}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddStationModal;