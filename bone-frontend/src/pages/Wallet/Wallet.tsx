import React, { useEffect, useRef, useState } from 'react';
import Styles from './index.module.less'
import well from '@/assets/DogMiner/wallet.png'
import sync from '@/assets/DogMiner/sync.png'
import { icrc1_balance_of, icrc1_decimals as icp_icrc1_decimals, icrc2_approve as icp_icrc2_approve, icrc1_fee, icp_icrc1_transfer } from '@/api/icp';
import appStore from '@/store/app';
import { Principal } from '@dfinity/principal';
import { dogmi_icrc1_balance_of, dogmi_icrc1_decimals, dogmi_icrc1_fee, dogmi_icrc1_transfer, dogmi_icrc2_approve } from '@/api/dogmi';
import { bone_icrc1_balance_of, icrc1_decimals as bone_icrc1_decimals, bone_icrc1_fee, bone_icrc1_transfer, icrc2_approve as bone_icrc2_approve } from '@/api/bone';
import { divideAndConvertToNumber, formatAmountByUnit, isValidAccountId, isValidPrincipal } from '@/utils/common';
import Big from 'big.js';
import { Box, InputBase, InputLabel, Modal, Skeleton } from '@mui/material';
import { observer } from 'mobx-react-lite';
import CloseIcon from '@mui/icons-material/Close';
import Message from '@/components/Snackbar/message';
import { LoadingButton } from '@mui/lab';
import { AccountIdentifier } from '@dfinity/ledger-icp';
import { TransferArg, TransferArgs } from '@dfinity/ledger-icp/dist/candid/ledger';
import { Result } from '@/canisters/bone/bone.did';
import SnackbarProgress, { SnackbarModalHandles } from '@/components/SnackbarProgress/SnackbarProgress';
interface UserInfoProps {
  //message under components/Snackbar is no longer used
  onWellModal: (Param: Boolean) => void;
  openSelectWell: Boolean;
}
const addseticpModalStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#212224',
  borderRadius: '8px',
  width: '350px',
  padding: '20px',
  outline: 'none',
};
const Wallet = observer((props: UserInfoProps) => {
  const [icpwells, seticpwells] = useState<string>()
  const [bonewells, setbonewells] = useState<string>()
  const [dogmiwells, setdogmiwells] = useState<string>()
  const [bonedecimals, setbonedecimals] = useState<number>(8)
  const [dogmidecimals, setdogmidecimals] = useState<number>(18)
  const [icpdecimals, seticpdecimals] = useState<number>(8)
  const req_icrc1_balance_of = async (decimals: number) => {
    const res = await icrc1_balance_of([
      {
        owner: Principal.fromText(appStore.userId),
        subaccount: [],
      }
    ])
    seticpwells(divideAndConvertToNumber(res, decimals).toString())
  }
  const req_dogmi_icrc1_balance_of = async (decimals: number) => {
    const res = await dogmi_icrc1_balance_of([
      {
        owner: Principal.fromText(appStore.userId),
        subaccount: [],
      }
    ])
    setdogmiwells(divideAndConvertToNumber(res, decimals).toString())
  }
  const req_bone_icrc1_balance_of = async (decimals: number) => {
    const res = await bone_icrc1_balance_of([
      {
        owner: Principal.fromText(appStore.userId),
        subaccount: [],
      }
    ])
    setbonewells(divideAndConvertToNumber(res, decimals).toString())
  }
  const btnupdata = (well: string) => {
    if (!appStore.userId) {
      props.onWellModal(true);
      return
    }
    if (well == 'BONE') {
      setbonewells(undefined)
      req_bone_icrc1_balance_of(bonedecimals)
    } else if (well == 'DOGMI') {
      setdogmiwells(undefined)
      req_dogmi_icrc1_balance_of(dogmidecimals)
    } else if (well == 'ICP') {
      seticpwells(undefined)
      req_icrc1_balance_of(icpdecimals)
    }
  }

  const req_bone_icrc1_decimals = async () => {
    const res = await bone_icrc1_decimals()
    req_bone_icrc1_balance_of(res)
    setbonedecimals(res)
  }
  const req_dogmi_icrc1_decimals = async () => {
    const res = await dogmi_icrc1_decimals()
    req_dogmi_icrc1_balance_of(res)
    setdogmidecimals(res)

  }
  const req_icp_icrc1_decimals = async () => {
    const res = await icp_icrc1_decimals()
    req_icrc1_balance_of(res)
    seticpdecimals(res)
  }
  const [openModalVal, setopenModal] = useState(false);
  const [feeVal, setfeeVal] = useState<string>('');
  const [amount, setamount] = useState<string | number>('');
  const [openbuyAmountLoding, setopenbuyAmountLoding] = useState(false);
  const [btnfomoText, setbtnfomoText] = useState('Enter amount');
  const [isshow, setisshow] = useState(true);
  const [toamount, settoamount] = useState<string>()
  const handleadsenticp = () => {
    setopenModal(false);
    // setamount(0);
  };
  const btnMax = () => {
    if (curBalance && curBalance.toString() != '0' && Number(curBalance) != 0) {

      setamount(new Big(curBalance?.toString()!).minus(curfee?.toString()!).toString());
    } else {
      setamount('');
    }
  };
  const inputamountchange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (typeof Number(e.target.value) == 'number' && !isNaN(Number(e.target.value))) {
      setamount(e.target.value);
    } else {
      // props.onRouteChange({ type: 'error', content: 'The entered value is incorrect' });
      Message.error('The entered value is incorrect');
    }
    console.log(e);
  };
  const btnsetamount = async () => {
    let transfer: () => Promise<Result>
    let tempamount: string = '0'
    if (!appStore.userId) {
      props.onWellModal(true);
      return
    }
    if (!toamount) {
      return;
    }
    if (isValidPrincipal(toamount.toString())) {
      console.log('');
    } else {
      throw new Error('Invalid ICP Address!');
    }
    setopenbuyAmountLoding(true)
    let Transferparams
    if (curselectwall == 'BONE') {
      transfer = bone_icrc1_transfer
      tempamount = new Big(amount).times(new Big(10).pow(bonedecimals)).toString()
      Transferparams = {
        to: {
          owner: Principal.fromText(toamount.toString()),
          subaccount: []
        },
        fee: [BigInt(bonefee)],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: BigInt(tempamount),
      }
    } else if (curselectwall == 'DOGMI') {
      transfer = dogmi_icrc1_transfer
      tempamount = new Big(amount).times(new Big(10).pow(dogmidecimals)).toString()
      Transferparams = {
        to: {
          owner: Principal.fromText(toamount.toString()),
          subaccount: []
        },
        fee: [BigInt(dogmifee)],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: BigInt(tempamount),
      }
    } else if (curselectwall == 'ICP') {
      transfer = icp_icrc1_transfer
      tempamount = new Big(amount).times(new Big(10).pow(icpdecimals)).toString()
      Transferparams = {
        to: {
          owner: Principal.fromText(toamount.toString()),
          subaccount: []
        },
        fee: [BigInt(icpfee)],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: BigInt(tempamount),
      }
    }
    handleButtonClick(true)
    try {
      //@ts-ignore
      const res = await transfer([Transferparams])
      if ('Err' in res) {
        Message.error('Transfer failed!')
        console.log(res['Err']);
        handleButtonClick(false)
      } else {
        Message.success('Transfer successful!')
        setopenModal(false)
      }
    } catch (err) {
      Message.error('Transfer failed!')
      console.log(err);
    } finally {
      handleButtonClick(false)
      setopenbuyAmountLoding(false)
    }
  }
  const [curselectwall, setcurselectwall] = useState<string>()
  const [curfee, setcurfee] = useState<string>()
  const [curBalance, setcurBalance] = useState<string>()
  const opensendamountmodal = (well: string) => {
    setamount('')
    settoamount('')
    setopenModal(true)
    setcurselectwall(well)
    if (well == 'BONE') {
      setcurfee(new Big(bonefee.toString()).div(new Big(10).pow(bonedecimals)).toString())
      setcurBalance(bonewells?.toString())
    } else if (well == 'DOGMI') {
      setcurfee(new Big(dogmifee.toString()).div(new Big(10).pow(dogmidecimals)).toString())
      setcurBalance(dogmiwells?.toString())
    } else if (well == 'ICP') {
      setcurfee(new Big(icpfee.toString()).div(new Big(10).pow(icpdecimals)).toString())
      setcurBalance(icpwells?.toString())
    }
  }
  const [bonefee, setbonefee] = useState<string>('1000000')
  const [dogmifee, setdogmifee] = useState<string>('1000000000000000000')
  const [icpfee, seticpfee] = useState<string>('10000')
  const req_bone_icrc1_fee = async () => {
    const res = await bone_icrc1_fee()
    setbonefee(res.toString())
  }
  const req_dogmi_icrc1_fee = async () => {
    const res = await dogmi_icrc1_fee()
    setdogmifee(res.toString())
  }
  const icp_icrc1_fee = async () => {
    const res = await icrc1_fee()
    seticpfee(res.toString())
  }
  const snackbarRef = useRef<SnackbarModalHandles>(null);
  const handleButtonClick = (RightBox: boolean, test?: string) => {
    if (snackbarRef.current) {
      snackbarRef.current.openSnackbar(test ? test : `${curselectwall} transfer in progress`, RightBox);
      snackbarRef.current.setViewProgress(true);
    }
  };
  const handleViewProgress = () => {
    console.log('');
  };
  useEffect(() => {
    if (amount && amount != 0 && toamount && toamount != '') {
      setisshow(false);
      if (new Big(amount).gt(new Big(curBalance!.toString()))) {
        setisshow(true);
        setbtnfomoText('Insufficient balance');
      }
      if (!(isValidAccountId(toamount.toString()) || isValidPrincipal(toamount.toString()))) {
        setisshow(true);
        setbtnfomoText(`Invalid Address`);
      }
    } else {
      setisshow(true);
      if (!amount && amount == 0) {
        setbtnfomoText(`Enter amount`);
      } else {
        setbtnfomoText('Enter the principal ID');
      }
    }
  }, [amount, toamount]);
  useEffect(() => {
    req_bone_icrc1_fee()
    req_dogmi_icrc1_fee()
    icp_icrc1_fee()
    setTimeout(() => {
      req_bone_icrc1_decimals()
      req_dogmi_icrc1_decimals()
      req_icp_icrc1_decimals()
      // req_icrc1_balance_of()
      // req_dogmi_icrc1_balance_of()
      // req_bone_icrc1_balance_of()
    }, 1000)
  }, [])
  return (
    <div className={Styles.page}>
      <div className={Styles.card}>
        <div className={Styles.cardItem}>
          <div className={Styles.header}>
            <div className={Styles.left}>BONE</div>
            <div className={Styles.right}>
              <img src={well} onClick={() => opensendamountmodal('BONE')} className={Styles.rotatingimageBONE} />
              <img src={sync} onClick={() => btnupdata('BONE')} />
            </div>
          </div>
          {
            appStore.userId ? bonewells ?
              <div className={Styles.btm}>{bonewells ? bonewells : '*********'}</div>
              :
              <div>
                <Skeleton variant="text" sx={{ bgcolor: '#F98C3F', height: '40px', width: '100px', marginTop: '30px' }} />
              </div> : <div className={Styles.btm}>*********</div>
          }

        </div>
        <div className={Styles.cardItem}>
          <div className={Styles.header}>
            <div className={Styles.left}>DOGMI</div>
            <div className={Styles.right}>
              <img src={well} onClick={() => opensendamountmodal('DOGMI')} className={Styles.rotatingimageDOGMI} />
              <img src={sync} onClick={() => btnupdata('DOGMI')} />
            </div>
          </div>
          {
            appStore.userId ? dogmiwells ? <div className={Styles.btm}>{dogmiwells ? dogmiwells : '*********'}</div> : <div>
              <Skeleton variant="text" sx={{ bgcolor: '#F98C3F', height: '40px', width: '100px', marginTop: '30px' }} />
            </div> : <div className={Styles.btm}>*********</div>
          }

        </div>
        <div className={Styles.cardItem}>
          <div className={Styles.header}>
            <div className={Styles.left}>ICP</div>
            <div className={Styles.right}>
              <img src={well} onClick={() => opensendamountmodal('ICP')} className={Styles.rotatingimageICP} />
              <img src={sync} onClick={() => btnupdata('ICP')} />
            </div>
          </div>
          {
            appStore.userId ? icpwells ? <div className={Styles.btm}>{icpwells ? icpwells : '*********'}</div> : <div>
              <Skeleton variant="text" sx={{ bgcolor: '#F98C3F', height: '40px', width: '100px', marginTop: '30px' }} />
            </div> : <div className={Styles.btm}>*********</div>
          }
        </div>
      </div>
      <Modal
        className={Styles.sendicpModal}
        open={openModalVal}
        onClose={handleadsenticp}
        style={{ borderColor: '#262939' }}
      >
        <Box
          sx={{
            ...addseticpModalStyles,
          }}
        >
          <div className={Styles.sendicp}>
            <div onClick={handleadsenticp}>
              <CloseIcon
                sx={{ color: '#fff', position: 'absolute', right: '10px', top: '8px', cursor: 'pointer' }}
              ></CloseIcon>
            </div>
            <div className={Styles.header}>SEND {curselectwall}</div>
            <div className={Styles.balanceInfo}>
              <div>
                Transfer Fee:
                <span className={Styles.MaxICPorBalance}>
                  {curfee} {curselectwall}
                </span>
              </div>
              <div>
                Balance:{curBalance}
                <span className={Styles.MaxICPorBalance} onClick={btnMax}>
                  Max
                </span>
              </div>
            </div>
            <div className={Styles.amountInput}>
              <InputLabel className={Styles.icpamount}>Amount</InputLabel>
              <InputBase
                className={Styles.amount}
                placeholder={`Enter ${curselectwall} amount`}
                value={amount}
                sx={{
                  '.css-3b6ca1-MuiInputBase-input': {
                    border: '1px soild red',
                  },
                }}
                // onChange={(e) => setamount(new Big(e.target.value).times(Math.pow(10, cyclesdecimals!)).toFixed(0, 0))}
                onChange={(e) => inputamountchange(e)}
              // required
              ></InputBase>
            </div>
            <div className={Styles.amountInput}>
              <InputLabel className={Styles.icpamount}>To</InputLabel>
              <InputBase
                className={Styles.amount}
                placeholder="Enter the principal ID"
                sx={{
                  '.css-3b6ca1-MuiInputBase-input': {
                    border: '1px soild red',
                  },
                }}
                // onChange={(e) => setamount(new Big(e.target.value).times(Math.pow(10, cyclesdecimals!)).toFixed(0, 0))}
                onChange={(e) => settoamount(e.target.value)}
              // required
              ></InputBase>
            </div>
            <LoadingButton
              id="openbuyLoding"
              loading={openbuyAmountLoding}
              className={Styles.openbuyAmountLoding}
              sx={{
                color: isshow ? '#eef7ff' : '#fff',
                backgroundImage: 'linear-gradient(235deg, #F98C3F 0%, #F98C3F 100%)',
                pointerEvents: isshow ? 'none' : '',
              }}
              onClick={btnsetamount}
            >
              <div style={{ display: isshow ? 'none' : '' }}>Confirm</div>
              <div
                style={{
                  fontSize: isshow ? 14 : 14,
                  fontWeight: isshow ? 'normal' : 'normal',
                  display: isshow ? '' : 'none',
                }}
              >
                {btnfomoText}
              </div>
            </LoadingButton>
          </div>
        </Box>
      </Modal>
      <SnackbarProgress ref={snackbarRef} onViewProgress={handleViewProgress}></SnackbarProgress>
    </div>
  );
})

export default Wallet;
