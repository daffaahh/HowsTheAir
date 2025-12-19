import React from 'react';
import { Layout, Menu, theme } from 'antd';
import { DashboardOutlined, DatabaseOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import DataManagement from './pages/DataManagement';
import Dashboard from './pages/Dashboard';
import Cities from './pages/Cities';

const { Content, Footer, Sider } = Layout;

const AppLayout: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const location = useLocation();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/data') return ['2'];
    if (path === '/cities') return ['3'];
    return ['1'];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
      breakpoint="lg" 
      collapsedWidth="0"
      style={{
          overflow: 'auto',   
          height: '100vh',     
          position: 'sticky',  
          top: 0, 
          left: 0,
        }}
      >
        
        <Menu 
          theme="dark" 
          mode="inline" 
          style={{ marginTop: 20}}
          selectedKeys={getSelectedKey()} 
        >
          <Menu.Item key="1" icon={<DashboardOutlined />}>
            <Link to="/">Dashboard</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<DatabaseOutlined />}>
            <Link to="/data">Data Polusi</Link>
          </Menu.Item>
          <Menu.Item key="3" icon={<EnvironmentOutlined />}>
            <Link to="/cities">Master Station</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
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
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;