import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home/Home';
import DogAlliance from '@/pages/DogAlliance/DogAlliance';
import Dashboard from '@/pages/Dashboard/Dashboard';
import Wallet from '@/pages/Wallet/Wallet';
import DogMiner from '@/pages/DogMiner/DogMiner';
type messageInfo = {
  type: 'error' | 'info' | 'success' | 'warning';
  content: string;
};
interface RoutingProps {
  onMessageModal: (messageInfo: messageInfo) => void;
  onEditWellOpen: (value: Boolean) => void;
  openSelectWell: Boolean;
}
const Routing = (props: RoutingProps) => {
  const hanldWellModal = (value: Boolean) => {
    props.onEditWellOpen(value);
  };
  return (
    <Routes>
      <Route path="*" element={<Home />} />
      <Route path="/DogMiner" element={
        <DogMiner
          onWellModal={hanldWellModal}
          openSelectWell={props.openSelectWell}
        />}
      />
      <Route path="/DogAlliance" element={<DogAlliance onWellModal={hanldWellModal}
        openSelectWell={props.openSelectWell} />} />
      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/Wallet" element={<Wallet openSelectWell={props.openSelectWell} onWellModal={hanldWellModal} />} />
    </Routes>
  );
};

export default Routing;
