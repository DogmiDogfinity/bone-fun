import React, { useEffect, useState } from 'react';
import Styles from './index.module.less'
import logo from '@/assets/header/logo.jpg'
import { observer } from 'mobx-react-lite';
import { Box, Checkbox, Fade, FormControlLabel, FormGroup, Modal, Popover } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
// @ts-ignore
import { walletList } from '../../artemis-web3-adapter/src/wallets/wallet-list.js';
import classNames from 'classnames';
import { disconnect, requestConnect, verifyConnectionAndAgent } from '@/utils/wallet/connect.js';
import appStore, { setUserId } from '@/store/app.js';
import Message from '@/components/Snackbar/message';
import share from '@/assets/header/share.png'
import copy from '@/assets/header/copy.png'
import closewell from '@/assets/header/closewell.png'
import { truncateString } from '@/utils/principal.js';
import { useLocation, useNavigate } from 'react-router-dom';
interface ChildComponentProps {
  //message under components/Snackbar is no longer used
  onMessageModal: (messageInfo: { type: 'error' | 'info' | 'success' | 'warning'; content: string }) => void;
  openSelectWell: Boolean;
  editOpenSelectWell: (Param: Boolean) => void;
}
const ModolWalletStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  // width: 300,
  backgroundColor: '#212224',
  borderRadius: '8px',
  borderColor: '#212224',
  overflow: 'auto',
  // pt: 2,
  // px: 3,
  // pb: 3,
};
const TitleStyle = {
  fontFamily: '',
  fontSize: '22px',
  color: '#FFFFFF',
  letterSpacing: '0',
  fontWeight: '600',
  display: 'flex',
  justifyContent: 'center',
};
const Header: React.FC<ChildComponentProps> = observer((props) => {
  const menu: { title: string, path: string }[] = [
    {
      title: 'Home',
      path: '/Home'
    },
    {
      title: 'Dog Miner',
      path: '/DogMiner'
    },
    {
      title: 'Dog Alliance',
      path: '/DogAlliance'
    },
    {
      title: 'Dashboard',
      path: '/Dashboard'
    },
    {
      title: 'Wallet',
      path: '/Wallet'
    }
  ]
  const [curmenu, setCurmenu] = React.useState<string>('Home')
  const [openCreateWallet, setOpenCreateWallet] = React.useState(false);
  const [CheckboxVal, setCheckboxVal] = React.useState(true);
  const [userinfoMOdal, setuserinfoMOdal] = React.useState('userinfoMOdal')
  const [openuserinfoMOdal, setopenuserinfoMOdal] = React.useState(false)
  const navigate = useNavigate();
  const btnMenu = (menuitem: { title: string, path: string }) => {
    navigate(menuitem.path)
    // Message.error('opening soon');
    setCurmenu(menuitem.title)
    localStorage.setItem('curbtnmenu', menuitem.title)
  }
  const location = useLocation();
  const currentPath = location.pathname;
  const handleCloseWallet = () => {
    setOpenCreateWallet(false);
    props.editOpenSelectWell(false);
  };
  const CheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckboxVal(e.target.checked);
  };
  const btnService = () => {
    // window.open('https://docs.fomowell.com/legal-and-privacy/terms-of-service');
  };
  const BtnSelectWallet = async (type: string) => {
    if (CheckboxVal) {
      await requestConnect(type)
        .then(() => {
          if (appStore.userId) {
            console.log(appStore.userId);

            // getUserInfo(appStore.userId);
            setUserId(appStore.userId);
            setOpenCreateWallet(false);
          } else {
            throw Error('error');
          }
        })
        .catch((err) => {
          console.log(err);
          Message.error('Connect error');
          // props.onMessageModal({ type: 'error', content: 'Connect error' });
        })
        .finally(() => {
          props.editOpenSelectWell(false);
        });
    } else {
      // console.log(false);
    }
  };
  const handleOpenWallet = () => {
    setOpenCreateWallet(true);
  };
  const btnuserinfo = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
    setopenuserinfoMOdal(true)
  }
  const handleClose = () => {
    setopenuserinfoMOdal(false);
    setAnchorEl(null);
  };
  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null);
  const BtnDisconnectWallet = async () => {
    await disconnect();
    props.editOpenSelectWell(false);
    setopenuserinfoMOdal(false);
  };
  const btntohome = () => {
    navigate('/home')
  }
  const getAccountDashboardURL = (accountId: string) =>
    window.open(`https://dashboard.internetcomputer.org/account/${accountId}`);
  const getPrincipalDashboardURL = (canisterId: string) =>
    window.open(`https://dashboard.internetcomputer.org/account/${canisterId}`);
  const CanisterCopyBtnFn = (copyText: string) => {
    navigator.clipboard.writeText(copyText).then(
      () => {
        Message.success('Success!');
      },
      () => {
        Message.error('clipboard write failed');
      },
    );
  };
  useEffect(() => {
    console.log();

    verifyConnectionAndAgent().finally(() => {
      setUserId(appStore.userId);
      // console.log('verifyConnect');

    });
  }, [])
  useEffect(() => {
    const currentMenu = menu.find(item => item.path === location.pathname);
    if (currentMenu) {
      setCurmenu(currentMenu.title);
    }
  }, [location.pathname]);
  useEffect(() => {
    if (openuserinfoMOdal) {
      setuserinfoMOdal('userinfoMOdal')
    } else {
      setuserinfoMOdal('')
    }
  }, [openuserinfoMOdal])
  useEffect(() => {
    if (props.openSelectWell) {
      setOpenCreateWallet(true);
    } else {
      setOpenCreateWallet(false);
    }
  }, [props.openSelectWell]);
  return (
    <div className={Styles.header}>
      <div className={Styles.com}>
        <div className={Styles.logogroup} onClick={btntohome}>
          <img className={Styles.logo} src={logo} />
          <div className={Styles.text}>BONE</div>
        </div>
        <div className={Styles.right}>
          <div className={Styles.menu}>
            {
              menu.map((item) => {
                return <div key={item.title} className={`${Styles.menuItem} ${curmenu.includes(item.title) ? Styles.active : ''}`} onClick={() => btnMenu(item)}>{item.title}</div>
              })
            }
          </div>
          {
            appStore.userId ? <div className={Styles.connectWallet} onClick={(e) => btnuserinfo(e)}>
              {appStore.userId.split('-')[0]}
            </div> : <div className={Styles.connectWallet} onClick={handleOpenWallet}>
              {'Connect Wallet'}
            </div>
          }
        </div>
      </div>
      <Popover
        id={userinfoMOdal}
        open={openuserinfoMOdal}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        sx={{
          '.MuiPaper-root': {
            borderRadius: '8px',
            backgroundColor: '#212224',
            marginTop: '10px'
          }
        }}
      >
        <div className={Styles.userModal}>
          <div className={Styles.id}>
            <div className={Styles.info}>
              <div className={Styles.label}>Principal ID:</div>
              <div className={Styles.valuegroup}>
                <div className={Styles.value}>{truncateString(appStore.userId)}</div>
                <div className={Styles.option}>
                  <img src={share} onClick={() => getPrincipalDashboardURL(appStore.userId)} />
                  <img src={copy} onClick={() => CanisterCopyBtnFn(appStore.userId)} />
                </div>
              </div>
            </div>
          </div>
          <div className={Styles.id}>
            <div className={Styles.info}>
              <div className={Styles.label}>Account ID:</div>
              <div className={Styles.valuegroup}>
                <div className={Styles.value}>{truncateString(appStore.accountId)}</div>
                <div className={Styles.option}>
                  <img src={share} onClick={() => getAccountDashboardURL(appStore.accountId)} />
                  <img src={copy} onClick={() => CanisterCopyBtnFn(appStore.accountId)} />
                </div>
              </div>
            </div>
          </div>
          <div className={Styles.closeWell} >
            <img src={closewell} onClick={BtnDisconnectWallet} />
          </div>
        </div>
      </Popover>
      <div className={Styles.phone}>
        <div className={Styles.menu}>
          {
            menu.map((item) => {
              return <div key={item.title} className={`${Styles.menuItem} ${curmenu.includes(item.title) ? Styles.active : ''}`} onClick={() => btnMenu(item)}>{item.title}</div>
            })
          }
        </div>
      </div>
      <Modal
        // disableAutoFocus
        open={openCreateWallet}
        sx={{ '.css-pjyw4r': { paddingLeft: '18px', paddingRight: '0px', zIndex: '55' } }}
        onClose={handleCloseWallet}
        style={{ borderColor: '#262939' }}
      >
        <Fade in={openCreateWallet}>
          <Box sx={{ ...ModolWalletStyle }} className={Styles.WalletHowWorks}>
            <div className={Styles.RightClose}>
              <div className={Styles.Title} style={{ ...TitleStyle }}>
                Connect Wallet
              </div>
              <CloseIcon
                sx={{ color: 'rgba(255,255,255,0.45)', height: '45px', cursor: 'pointer' }}
                style={{ position: 'absolute', right: '20px', top: '10px' }}
                onClick={handleCloseWallet}
              ></CloseIcon>
            </div>
            {walletList.map((item: { id: string; name: string; icon: any; adapter: any; walletName: string }) => {
              // const isActive = curType === item.id || checked;
              return (
                <div
                  className={classNames(Styles.InternetIdentity, CheckboxVal && Styles.walletActive)}
                  // style={{
                  //   '.InternetIdentity:hover': {
                  //     backgroundColor: CheckboxVal ? '#1B1D28' : '',
                  //   },
                  // }}
                  onClick={() => BtnSelectWallet(item.id)}
                  key={item.id}
                >
                  <div className={Styles.Left}>
                    <img src={item.icon} className={classNames(CheckboxVal && Styles.active)} />
                    <div className={classNames(Styles.Text, CheckboxVal && Styles.active)}>{item.name}</div>
                  </div>
                  {/* <img style={{ display: item.isCheck ? '' : 'none' }} className={Styles.SelectIcon} src={checkIcon} /> */}
                </div>
              );
            })}
          </Box>
        </Fade>
      </Modal>
    </div >
  )
}
)

export default Header;