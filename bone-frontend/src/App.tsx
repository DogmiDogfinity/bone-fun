window.global ||= window;
import { BrowserRouter } from 'react-router-dom';
import { Alert, CssBaseline, Snackbar } from '@mui/material';
import Routing from './routes/Routing';
import Header from './layout/header';
import React from 'react';
import SnackbarModal from '@/components/Snackbar/Snackbar';
import { Provider } from 'react-redux';
import store from '@/store/app/store';
export type messageInfo = {
  type: 'error' | 'info' | 'success' | 'warning';
  content: string;
};
const App = () => {
  const [OpenSelectWell, setOpenSelectWell] = React.useState<Boolean>(false);
  const [MessageOpen, setMessageOpen] = React.useState(false);
  const [MessageInfo, setMessageInfo] = React.useState<messageInfo>({
    type: 'success',
    content: 'Success!',
  });
  const setMessageIsOpen = (MessageParams: messageInfo): void => {
    setMessageOpen(true);
    setMessageInfo(MessageParams);
  };
  const editOpenSelectWell = (value: Boolean) => {
    setOpenSelectWell(value);
  };
  return (
    <BrowserRouter>
      <SnackbarModal></SnackbarModal>
      <Header
        onMessageModal={setMessageIsOpen}
        openSelectWell={OpenSelectWell}
        editOpenSelectWell={editOpenSelectWell}>
      </Header>
      <div style={{ marginTop: '80px' }}>
        <Routing
          onMessageModal={setMessageIsOpen}
          onEditWellOpen={editOpenSelectWell}
          openSelectWell={OpenSelectWell}
        />
      </div>
    </BrowserRouter>

  );
};

export default App;
