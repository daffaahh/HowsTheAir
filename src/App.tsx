import React from 'react';
import { Layout, Menu, theme } from 'antd';
import { DashboardOutlined, DatabaseOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DataManagement from './pages/DataManagement';
import Dashboard from './pages/Dashboard';
import Cities from './pages/Cities';


const { Header, Content, Footer, Sider } = Layout;

const App: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider breakpoint="lg" collapsedWidth="0">
          <div className="demo-logo-vertical" style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
          <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Item key="1" icon={<DashboardOutlined />}>
              <Link to="/">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<DatabaseOutlined />}>
              <Link to="/data">Data Polusi</Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<EnvironmentOutlined />}>
              <Link to="/cities">Master Kota</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Header style={{ padding: 0, background: colorBgContainer }} />
          <Content style={{ margin: '24px 16px 0' }}>
            <div
              style={{
                padding: 24,
                minHeight: 360,
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/data" element={<DataManagement />} />
                <Route path="/cities" element={<Cities />} />
              </Routes>
            </div>
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            HTA ©{new Date().getFullYear()} Created by Daffa
          </Footer>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;