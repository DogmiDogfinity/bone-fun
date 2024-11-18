import React, { useEffect, useRef, useState } from 'react';
import Styles from './index.module.less'
import { InputBase, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Modal, Box, InputAdornment, Card, CardContent, Skeleton, Typography, Tooltip } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import appStore from '@/store/app';
import { formatAmountByUnit } from '@/utils/common';
import tokenStore from '@/store/token';
import topright from '@/assets/DogMiner/topright.png'
import lefticon from '@/assets/header/titleleft.png'
import tableicon from '@/assets/DogMiner/tablelogo.png'
import Copper from '@/assets/DogMiner/Copper.png'
import Gold from '@/assets/DogMiner/Gold.png'
import Silver from '@/assets/DogMiner/Silver.png'
import Diamond from '@/assets/DogMiner/Diamond.png'
import well from '@/assets/DogMiner/wallet.png'
import { add_cycles, create_dog, dog_info, dog_level_upgrade, get_dogs, leave_alliance } from '@/api/bone_main';
import { icrc1_decimals, icrc1_fee, icrc2_approve, icrc1_balance_of as icp_icrc1_balance_of } from '@/api/icp';
import { icrc1_decimals as bone_icrc1_decimals, icrc2_approve as bone_icrc2_approve, canisterId as bone_canisterId } from '@/api/bone';
import { canisterId } from '@/api/bone_main'
import { Principal } from '@dfinity/principal';
import Big from 'big.js';
import { cycles } from '@/api/bone_dog';
import SnackbarProgress, { SnackbarModalHandles } from '@/components/SnackbarProgress/SnackbarProgress';
import { DogContext } from '@/canisters/bone_dog/bone_dog.did';
import { truncateString } from '@/utils/principal';
import Message from '@/components/Snackbar/message';
import { observer } from 'mobx-react-lite';
import CloseIcon from '@mui/icons-material/Close';
import { dogmi_icrc1_decimals, dogmi_icrc2_approve } from '@/api/dogmi';
import share from '@/assets/header/share.png'
import copy from '@/assets/header/copy.png'
import help from '@/assets/DogMiner/help.png'
import { DogContextOut } from '@/canisters/bone_main/bone_main.did';
const CanisterDevelopersModalStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#212224',
  borderRadius: '8px',
  width: '380px',
  padding: '20px',
  outline: 'none',
}
const addCyclesModalStyles = {
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
interface UserInfoProps {
  //message under components/Snackbar is no longer used
  onWellModal: (Param: Boolean) => void;
  openSelectWell: Boolean;
}
const DogMiner = observer((props: UserInfoProps) => {
  const columns = [
    {
      title: 'Canister ID',
      key: 'owner'
    },
    {
      title: 'Identity',
      key: 'name'
    },
    {
      title: 'Level',
      key: 'dog_level'
    },
    {
      title: 'Blocks Mined',
      // key: 'mining_type'
      key: 'ore_cnt'
    },
    {
      title: 'Cycles Balance',
      key: 'cyclesres'
    },
    {
      title: 'Status',
      key: 'mining_state'
    },
    {
      title: 'Alliance ID',
      key: 'mining_alliance',
    },
    {
      title: 'Evolution',
      key: 'Evolution'
    }
  ]
  const selectcolumns = [
    {
      title: 'Identity',
      key: 'name'
    },
    {
      title: 'Level',
      key: 'dog_level'
    },
    {
      title: 'Cycles Balance',
      key: 'cyclesres'
    },
  ]
  const [createname, setcreatename] = useState<string>()
  const [CreateLoding, setCreateFomoLOding] = useState<boolean>(false)
  const [icpdecimals, seticpdecimals] = useState<number>()
  const [bonedecimals, setbonedecimals] = useState<number>()
  const [dogmidecimals, setdogmidecimals] = useState<number>()
  const [dog_infos, setdog_infos] = useState<DogContextOut[]>([])
  const [topupLoding, settopupLoding] = useState(false)
  const [islodinginfo, setislodinginfo] = useState(true)
  const [curcyclesitem, setcurcyclesitem] = useState<DogContextOut>()
  const [icpfee, seticpfee] = useState<string>()
  const btncreate = async () => {
    if (!appStore.userId) {
      props.onWellModal(true);
      return
    }
    if (!createname) {
      Message.error('Please enter name.');
      return
    }
    handleButtonClick(true)
    setCreateFomoLOding(true)
    const amount = new Big(1.0002).times(new Big(10).pow(icpdecimals ? icpdecimals : 8)).toString();
    await icrc2_approve([
      {
        amount: BigInt(amount),
        created_at_time: [],
        expected_allowance: [],
        expires_at: [],
        fee: [],
        from_subaccount: [],
        memo: [],
        spender: {
          owner: Principal.fromText(canisterId),
          subaccount: [],
        },
      },
    ]).then((res) => {
      req_create_dog()
    }).catch((error) => {
      Message.error('Create dog miner failed');
      setCreateFomoLOding(false)
      handleButtonClick(false)
      console.log(error);
    })

  }
  const req_create_dog = async () => {
    try {
      const res = await create_dog([createname!])
      if ('Err' in res) {
        Message.error('Create dog miner failed');
        console.log(res);
      } else {
        req_get_dogs()
        handleButtonClick(false)
        Message.success('Create dog miner successfully')
      }
    } catch (err) {
      Message.error('Create dog miner failed');
      console.log(err);
    } finally {
      setCreateFomoLOding(false)
      settopupLoding(false)
      handleButtonClick(false)
    }
  }
  const req_get_dogs = async () => {
    if (!appStore.userId) {
      setislodinginfo(false);
      return;
    }
    setislodinginfo(true);
    const res = await dog_info([Principal.fromText(appStore.userId)]);
    setislodinginfo(false);
    setdog_infos(res);

    const newTempCycles = {} as any;
    await Promise.all(
      res.map(async (item) => {
        const cyclesres = await cycles(item.dog_id.toString());
        newTempCycles[item.dog_id.toString()] = cyclesres;
      })
    );
    setdogcycles(newTempCycles);
  };
  const [dogcycles, setdogcycles] = useState()
  const req_icrc1_decimals = async () => {
    const res = await icrc1_decimals()
    seticpdecimals(res)
  }
  function scientificToString(num) {
    const number = Number(num);
    if (isNaN(number)) {
      return "Invalid input";
    }
    return number.toFixed(20).replace(/\.?0+$/, '');
  }
  const req_icrc1_fee = async () => {
    const res = await icrc1_fee()
    // seticpfee(res.toString())
    seticpfee(scientificToString(new Big(res.toString()).div(new Big(10).pow(8)).toString()))
  }
  const snackbarRef = useRef<SnackbarModalHandles>(null);
  const handleButtonClick = (RightBox: boolean, test?: string) => {
    if (snackbarRef.current) {
      snackbarRef.current.openSnackbar(test ? test : 'Create dog miner in progress', RightBox);
      snackbarRef.current.setViewProgress(true);
    }
  };
  const handleViewProgress = () => {
    console.log('');
  };
  const [opentopup, setopentopup] = useState(false)
  const [curbtnitem, setcurbtnitem] = useState<DogContextOut>()
  const [displayValue, setDisplayValue] = React.useState<string>('');
  const [openbuyAmountLoding, setopenbuyAmountLoding] = React.useState(false);
  const [updataloding, setupdataloding] = useState(false)
  const [updataname, setupdataname] = useState('SilverDog')
  const [curupdatafee, setcurupdatafee] = useState('100 BONE')
  const handleopentoup = () => {
    setopentopup(false)
  }
  const opentopupmodal = (curinfo: DogContextOut) => {
    setcurbtnitem(curinfo)
    if (Object.keys(curinfo['dog_level'])[0] == 'CopperDog') {
      setupdataname('SilverDog')
      setcurupdatafee('100 BONE')
    } else if (Object.keys(curinfo['dog_level'])[0] == 'SilverDog') {
      setupdataname('GoldDog')
      setcurupdatafee('100 BONE')
    } else if (Object.keys(curinfo['dog_level'])[0] == 'GoldDog') {
      setupdataname('DiamondDog')
      setcurupdatafee('1000000 DOGMI')
    }
    setopentopup(true)
  }
  const [addCycles, setAddCycles] = React.useState(false);
  const handleaddaddCycles = () => {
    setAddCycles(false);
  };
  const btnMax = () => {
    if (icpwells && icpwells.toString() != '0' && Number(icpwells) != 0) {
      setaddcyclesamount(new Big(icpwells?.toString()!).minus(icpfee?.toString()!).toString());
    } else {
      setaddcyclesamount('');
    }
  };
  const [addcyclesamount, setaddcyclesamount] = useState<string>('0')
  const inputamountchange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (typeof Number(e.target.value) == 'number' && !isNaN(Number(e.target.value))) {
      console.log(e);
      setaddcyclesamount(e.target.value.replace(/,/g, ''))
      // setamount(value.replace(/,/g, '')); 
    } else {
      // props.onRouteChange({ type: 'error', content: 'The entered value is incorrect' });
      Message.error('The entered value is incorrect');
    }
    // console.log(e);
  };
  const btnBuyamount = async () => {
    handleButtonClick(true, 'Add cycles in progress')
    setopenbuyAmountLoding(true)
    const amount = new Big(addcyclesamount).plus(icpfee ? new Big(icpfee).times(2).toString() : '20000').times(new Big(10).pow(8)).plus(1).toString()
    await icrc2_approve([
      {
        amount: BigInt(amount),
        created_at_time: [],
        expected_allowance: [],
        expires_at: [],
        fee: [],
        from_subaccount: [],
        memo: [],
        spender: {
          owner: Principal.fromText(canisterId),
          subaccount: [],
        },
      },
    ], 'ryjl3-tyaaa-aaaaa-aaaba-cai').then(() => {
      add_cycles_fn()
    }).catch((err) => {
      console.log(err);
      setopenbuyAmountLoding(false)
      handleButtonClick(false, 'Add cycles in progress')
      setAddCycles(false)
    })
    //@ts-ignore

  }
  const add_cycles_fn = async () => {
    try {
      const amount = new Big(addcyclesamount).times(new Big(10).pow(8)).toString()
      const res = await add_cycles([BigInt(amount), curcyclesitem.dog_id])
      if ('Err' in res) {
        Message.error('Add cycles failed');
        req_get_dogs()
        console.log(res['Err']);
      } else {
        Message.success('Add cycles successfully');
        setAddCycles(false)
      }
    } catch (err) {
      Message.error('Add cycles failed');
      console.log(err);
    } finally {
      setopenbuyAmountLoding(false)
      handleButtonClick(false, 'Add cycles in progress')
    }
  }
  const btntopup = (item: DogContext) => {
    setcurcyclesitem(item)
    setAddCycles(true)
  }
  const btnupdata = async () => {
    handleButtonClick(true, 'Level upgrade in progress')
    setupdataloding(true)
    let approve: any
    let amount
    if (Object.keys(curbtnitem!.dog_level)[0] == 'CopperDog') {
      approve = bone_icrc2_approve
      amount = new Big(100.1).times(new Big(10).pow(bonedecimals ? bonedecimals : 8)).plus(1).toString();
    } else if (Object.keys(curbtnitem!.dog_level)[0] == 'SilverDog') {
      approve = bone_icrc2_approve
      amount = new Big(100.1).times(new Big(10).pow(bonedecimals ? bonedecimals : 8)).plus(1).toString();
    } else if (Object.keys(curbtnitem!.dog_level)[0] == 'GoldDog') {
      approve = dogmi_icrc2_approve
      amount = new Big(1000050).times(new Big(10).pow(dogmidecimals ? dogmidecimals : 18)).plus(1).toString();
    } else if (Object.keys(curbtnitem!.dog_level)[0] == 'DiamondDog') {
      Message.error('no')
      return
    }
    await approve([
      {
        amount: BigInt(amount!),
        created_at_time: [],
        expected_allowance: [],
        expires_at: [],
        fee: [],
        from_subaccount: [],
        memo: [],
        spender: {
          owner: Principal.fromText(canisterId),
          subaccount: [],
        },
      },
    ]).then(() => {
      req_dog_level_upgrade()
    }).catch((error: any) => {
      Message.error('Level upgrade failed');
      setupdataloding(false)
      handleButtonClick(false)
      console.log(error);
    })
  }
  const req_dog_level_upgrade = async () => {
    try {
      //@ts-ignore
      const res = await dog_level_upgrade([curbtnitem.dog_id])
      if ('Err' in res) {
        Message.error('Level upgrade failed');
        console.log(res);
      } else {
        Message.success('Level upgrade successfully');
        req_get_dogs()
        setopentopup(false)
      }
    } catch (err) {
      Message.error('Level upgrade failed');
      console.log(err);
    } finally {
      setCreateFomoLOding(false)
      handleButtonClick(false)
      setupdataloding(false)
    }

  }
  const Imglevel = (item: any) => {
    if (Object.keys(item['dog_level'])[0] == 'CopperDog') {
      return <img src={Copper} />
    } else if (Object.keys(item['dog_level'])[0] == 'SilverDog') {
      return <img src={Silver} />
    } else if (Object.keys(item['dog_level'])[0] == 'GoldDog') {
      return <img src={Gold} />
    } else if (Object.keys(item['dog_level'])[0] == 'DiamondDog') {
      return <img src={Diamond} />
    }
  }
  const [openLeave, setopenLeave] = useState(false)
  const [openLeaveLoding, setopenLeaveLoding] = useState(false)
  const [curLeaveModal, setcurLeaveModal] = useState<DogContext>()
  const openLeavemodal = (item: DogContext) => {
    setcurLeaveModal(item)
    setopenLeave(true)
  }
  const handleopenLeave = () => {
    setopenLeave(false)
  }
  const btnleavedata = async () => {
    if (!appStore.userId) {
      props.onWellModal(true);
      return
    }
    handleButtonClick(true, 'Leave Dog Alliance in progress')
    setopenLeaveLoding(true)
    try {
      //@ts-ignore
      const res = await leave_alliance([curLeaveModal.dog_id, curLeaveModal.mining_alliance[0]])
      if ('Err' in res) {
        console.log(res);
        Message.error('Leave Dog Alliance failed');
      } else {
        Message.success('Leave Dog Alliance successfully');
        setopenLeave(false)
        req_get_dogs()
      }
    } catch (err) {
      console.log(err);
      Message.error('Leave Dog Alliance failed');
    } finally {
      handleButtonClick(false, 'Leave Dog Alliance in progress')
      setopenLeaveLoding(false)
    }
  }
  const req_bone_icrc1_decimals = async () => {
    const res = await bone_icrc1_decimals()
    setbonedecimals(res)
  }
  const req_dogmi_icrc1_decimals = async () => {
    const res = await dogmi_icrc1_decimals()
    setdogmidecimals(res)
  }
  const req_icp_icrc1_decimals = async () => {
    const res = await icrc1_decimals()
    req_icrc1_balance_of(res)
    seticpdecimals(res)
  }
  const [icpwells, seticpwells] = useState<string>('0')
  const [btnCyclestext, setbtnCyclestext] = useState<string>('Enter ICP amount')
  const [isshow, setisshow] = useState(false)
  const req_icrc1_balance_of = async (decimals: number) => {
    const res = await icp_icrc1_balance_of([
      {
        owner: Principal.fromText(appStore.userId),
        subaccount: [],
      }
    ])
    seticpwells(new Big(res.toString()).div(new Big(10).pow(decimals)).toString())
  }
  const getPrincipalDashboardURL = (canisterId: string) =>
    window.open(`https://dashboard.internetcomputer.org/canister/${canisterId}`);
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
    console.log(addcyclesamount, icpwells);

    if (addcyclesamount && Number(addcyclesamount) != 0 && !isNaN(Number(addcyclesamount))) {
      // console.log(amount, new Big(curCyclesBalance?.toString()!).toString());
      if (new Big(addcyclesamount).gt(new Big(icpwells?.toString()!))) {
        setisshow(true);
        setbtnCyclestext('Insufficient amount');
      } else {
        setisshow(false);
      }
    } else {
      setbtnCyclestext('Enter ICP amount');
      setisshow(true);
    }
  }, [addcyclesamount]);
  useEffect(() => {
    if (appStore.userId) {
      req_get_dogs()
      req_icp_icrc1_decimals()
    }
  }, [appStore.userId])
  useEffect(() => {
    req_icrc1_decimals().then(() => {
      req_icrc1_fee()
    })
    req_bone_icrc1_decimals()
    req_dogmi_icrc1_decimals()
    if (appStore.userId) {
      req_icp_icrc1_decimals()
    }
    setTimeout(() => {
      req_get_dogs()
    }, 1000)
  }, [])
  return (
    <div className={Styles.page}>
      <div className={Styles.pagetop}>
        <div className={Styles.left}>
          <div className={Styles.create}>
            <InputLabel required className={Styles.LabelCom}>
              Name
            </InputLabel>
            <InputBase
              className={Styles.inputCom}
              onChange={(e) => setcreatename(e.target.value)}
            // required
            ></InputBase>
          </div>
          <div className={Styles.createBtn}>
            <LoadingButton id='CreateFomo' loading={CreateLoding} className={Styles.CreateBone} sx={{ color: "#fff", }} onClick={btncreate}>
              <div className={Styles.top} style={{ display: CreateLoding ? 'none' : '' }}>{appStore.userId ? 'Create a Dog Miner' : 'Connect Wallet'}</div>
              <div className={Styles.buttom} style={{ display: CreateLoding ? 'none' : '' }}>{appStore.userId ? `Service Fees: 1 ICP` : ''}</div>
            </LoadingButton>
          </div>
        </div>
        <div className={Styles.right}>
          <img src={topright} />
        </div>
      </div>
      <div className={Styles.btm}>
        <div className={Styles.title}>
          <img src={lefticon} />
          <div className={Styles.text}>My Miner List</div>
        </div>
        {
          !islodinginfo ? dog_infos.length != 0 ?
            <Table className={Styles.table} sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead className={Styles.tableHead}>
                <TableRow className={Styles.bgccolor}>
                  {
                    columns.map((item, index) => {
                      return <TableCell key={index} className={Styles.textcolor}>{item.title}</TableCell>
                    })
                  }
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  dog_infos.map((item, index) => {
                    return (
                      <React.Fragment key={`${item.dog_id}`}>
                        <TableRow
                          className={Styles.TableCellstyleTableRow}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 }, marginTop: '10px' }}
                        >
                          {
                            columns.map((columnsitem, index) => {
                              if (columnsitem.key == 'name') {
                                return (
                                  <TableCell key={`${item.dog_id}column`} className={Styles.TableCellstyle} component="th" scope="row">
                                    <div className={Styles.tableicon}>
                                      {
                                        Imglevel(item)
                                      }
                                      <div>{item[columnsitem.key]}</div>
                                    </div>
                                    {/* {item[columnsitem.key as UserKeys]} */}
                                  </TableCell>
                                )
                              }
                              else if (columnsitem.key == 'owner') {
                                return (
                                  <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                    <div className={Styles.copy}>
                                      {truncateString(item['dog_id'].toString())}
                                      <img src={share} onClick={() => getPrincipalDashboardURL(item['dog_id'].toString())} />
                                      <img src={copy} onClick={() => CanisterCopyBtnFn(item['dog_id'].toString())} />
                                    </div>
                                  </TableCell>
                                )
                              }
                              else if (columnsitem.key == 'dog_level') {
                                return (
                                  <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                    {Object.keys(item[columnsitem.key])[0]}
                                  </TableCell>
                                )
                              } else if (columnsitem.key == 'Evolution') {
                                return (
                                  <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                    <span style={{ color: '#F98C3F', cursor: 'pointer', display: Object.keys(item['dog_level'])[0] == 'DiamondDog' ? 'none' : '' }} onClick={() => opentopupmodal(item)}>GO</span>
                                  </TableCell>
                                )
                              } else if (columnsitem.key == 'mining_state') {
                                return (
                                  <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                    <div className={Styles.helpState} >
                                      {Object.keys(item[columnsitem.key])[0] == 'ACTIVITY' ? 'ALIVE' : Object.keys(item[columnsitem.key])[0]}
                                      <Tooltip sx={{ fontSize: '18px' }} title={<div className={Styles.TooltipText} style={{ fontSize: '12px' }}>Mining halted due to low Cycles balance. Please top up!</div>}>
                                        <img style={{ display: Object.keys(item[columnsitem.key])[0] == 'ACTIVITY' ? 'none' : '' }} src={help} />
                                      </Tooltip>
                                    </div>
                                  </TableCell>
                                )
                              } else if (columnsitem.key == 'cyclesres') {
                                return (
                                  <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                    <div className={Styles.amountwarp}>
                                      {dogcycles && dogcycles[item.dog_id.toString()] ? formatAmountByUnit(dogcycles[item.dog_id.toString()].toString()) : ''}
                                      <div className={Styles.topup} onClick={() => btntopup(item)}>TOP-UP</div>
                                    </div>
                                  </TableCell>
                                )
                              } else if (columnsitem.key == 'ore_cnt') {
                                return (
                                  <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                    <div className={Styles.amountwarp}>
                                      {item[columnsitem.key].toString()}
                                    </div>
                                  </TableCell>
                                )
                              } else if (columnsitem.key == 'mining_alliance') {
                                return (
                                  <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                    {
                                      Object.keys(item['mining_type'])[0] == 'ALONE' ? '' : <span>{item[columnsitem.key][0]?.toString()}<span style={{ color: '#F98C3F', cursor: 'pointer', border: '1px solid #F98C3F', borderRadius: '8px', padding: '2px 4px', marginLeft: '3px' }} onClick={() => openLeavemodal(item)}>Leave</span></span>
                                    }
                                  </TableCell>
                                )
                              }
                            })
                          }
                        </TableRow>
                        <TableRow sx={{ height: '10px' }}>
                          <TableCell colSpan={5} sx={{ borderBottom: "none", padding: 0 }} />
                        </TableRow>
                      </React.Fragment>
                    )
                  })
                }
              </TableBody>
            </Table>
            :
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" color="textSecondary">
                No Data
              </Typography>
            </Box> :
            <div>
              <Skeleton variant="text" sx={{ bgcolor: '#212224', height: '48px' }} />
              <Skeleton variant="text" sx={{ bgcolor: '#212224', marginTop: '-10px', height: '48px', }} />
            </div>
        }
        <div className={Styles.tablephone}>
          {
            dog_infos.map((item, index) => {
              return (
                <div className={Styles.row} key={`${item.dog_id}phone`}>
                  {
                    columns.map((columnsitem, index) => {
                      if (columnsitem.key == 'name') {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value}>
                              <img src={tableicon} />
                            </div>
                          </div>
                        )
                      } else if (columnsitem.key == 'owner') {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value}>
                              <div className={Styles.copy}>
                                {truncateString(item['dog_id'].toString())}
                                <img src={share} onClick={() => getPrincipalDashboardURL(item['dog_id'].toString())} />
                                <img src={copy} onClick={() => CanisterCopyBtnFn(item['dog_id'].toString())} />
                              </div>
                            </div>
                          </div>
                        )
                      } else if (columnsitem.key == 'dog_level') {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value}>
                              {Object.keys(item[columnsitem.key])[0]}
                            </div>
                          </div>
                        )
                      } else if (columnsitem.key == 'Evolution') {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value}>
                              <span style={{ color: '#F98C3F', cursor: 'pointer' }} onClick={() => opentopupmodal(item)}>GO</span>
                            </div>
                          </div>
                        )
                      } else if (columnsitem.key == 'mining_state') {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value}>
                              <div className={Styles.helpState} >
                                {Object.keys(item[columnsitem.key])[0] == 'ACTIVITY' ? 'ALIVE' : Object.keys(item[columnsitem.key])[0]}
                                <Tooltip className={Styles.TooltipText} title="Mining halted due to low Cycles balance. Please top up!">
                                  <img style={{ display: Object.keys(item[columnsitem.key])[0] == 'ACTIVITY' ? 'none' : '' }} src={help} />
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        )
                      } else if (columnsitem.key == 'mining_type') {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value}>
                              {Object.keys(item[columnsitem.key])[0]}
                            </div>
                          </div>
                        )
                      } else if (columnsitem.key == 'ore_cnt') {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value}>
                              <div className={Styles.amountwarp}>
                                {item[columnsitem.key].toString()}
                              </div>
                            </div>
                          </div>
                        )
                      } else if (columnsitem.key == 'mining_alliance') {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value}>
                              {Object.keys(item['mining_type'])[0] == 'ALONE' ? '' : <span>{item[columnsitem.key][0]?.toString()}<span style={{ color: '#F98C3F', cursor: 'pointer', border: '1px solid #F98C3F', borderRadius: '8px', padding: '2px 4px', marginLeft: '3px' }} onClick={() => openLeavemodal(item)}>Leave</span></span>}
                            </div>
                          </div>
                        )
                      }
                      else {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value} >
                              <div className={Styles.amountwarp}>
                                {dogcycles && dogcycles[item.dog_id.toString()] ? formatAmountByUnit(dogcycles[item.dog_id.toString()].toString()) : ''}
                                <span className={Styles.topup} onClick={() => btntopup(item)}>TOP-UP</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                    })
                  }
                </div>
              )
            })
          }
        </div>
      </div>
      <SnackbarProgress ref={snackbarRef} onViewProgress={handleViewProgress}></SnackbarProgress>
      <Modal open={opentopup} className={Styles.opentopupModal} onClose={handleopentoup}>
        <Box
          sx={{
            ...CanisterDevelopersModalStyles,
          }}>
          <div className={Styles.content} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className={Styles.text} style={{ color: '#fff', width: '220px', textAlign: 'center' }}>
              This Dog Miner will evolve
              into a {updataname} Miner.
            </div>
            <div>
              <LoadingButton loading={updataloding} className={Styles.topupbtn} sx={{ color: "#fff", backgroundImage: 'linear-gradient(235deg, #F98C3F 0%, #F98C3F 100%)', marginTop: '10px', height: '30px', fontSize: '15px', width: '280px', }} onClick={btnupdata}>
                <div className={Styles.top}>{appStore.userId ? '' : 'Connect Wallet'}</div>
                <div className={Styles.buttom}>{appStore.userId ? `Service Fees: ${curupdatafee}` : ''}</div>
              </LoadingButton>
            </div>
          </div>
        </Box>
      </Modal>
      <Modal
        className={Styles.addCyclesModal}
        open={addCycles}
        onClose={handleaddaddCycles}
        style={{ borderColor: '#262939' }}
      >
        <Box
          sx={{
            ...addCyclesModalStyles,
          }}
        >
          <div className={Styles.addCycles}>
            <div onClick={handleaddaddCycles}>
              <CloseIcon
                sx={{ color: '#fff', position: 'absolute', right: '10px', top: '8px', cursor: 'pointer' }}
              ></CloseIcon>
            </div>
            <div className={Styles.header}>Add cycles</div>
            <div className={Styles.balanceInfo}>
              <div className={Styles.fee}>
                {/* {formatUnitToT(cyclesfee?.toString())} */}
                Fee: <span className={Styles.feeNum}>{icpfee} ICP</span>
              </div>
              {/* {formatUnitToT(curCyclesBalance?.toString())} */}
              <div className={Styles.balance}>
                <div>Balance: {formatAmountByUnit(icpwells)}</div>
                <span className={Styles.MaxBalance} onClick={btnMax}>
                  Max
                </span>
              </div>
            </div>
            <div className={Styles.amountInput}>
              <InputBase
                className={Styles.amount}
                placeholder="0.0"
                value={addcyclesamount}
                startAdornment={
                  <InputAdornment
                    position="end"
                    style={{
                      fontFamily: '',
                      fontSize: '14px',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'start',
                      marginRight: '5px',
                    }}
                  ></InputAdornment>
                }
                endAdornment={
                  <InputAdornment
                    position="end"
                    style={{
                      fontFamily: '',
                      fontSize: '14px',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'start',
                      marginRight: '5px',
                    }}
                  >
                    <div style={{ color: '#8f9ecd' }}>ICP</div>
                  </InputAdornment>
                }
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
            <LoadingButton
              id="openbuyLoding"
              loading={openbuyAmountLoding}
              className={Styles.openbuyAmountLoding}
              sx={{ backgroundImage: 'linear-gradient(235deg, #F98C3F 0%, #F98C3F 100%)', color: '#fff', pointerEvents: isshow ? 'none' : '', }}
              onClick={btnBuyamount}
            >
              <div style={{ display: isshow ? 'none' : '' }}>Confirm</div>
              <div
                style={{
                  fontSize: isshow ? 14 : 14,
                  fontWeight: isshow ? 'normal' : 'normal',
                  display: isshow ? '' : 'none',
                }}
              >
                {btnCyclestext}
              </div>
            </LoadingButton>
          </div>
        </Box>
      </Modal>
      <Modal open={openLeave} className={Styles.opentopupModal} onClose={handleopenLeave}>
        <Box
          sx={{
            ...CanisterDevelopersModalStyles,
          }}>
          <div className={Styles.content} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className={Styles.text} style={{ color: '#fff', width: '220px', textAlign: 'center' }}>
              Confirm to leave this Dog Alliance
            </div>
            <div>
              <LoadingButton loading={openLeaveLoding} className={Styles.topupbtn} sx={{ color: "#fff", backgroundImage: 'linear-gradient(235deg, #F98C3F 0%, #F98C3F 100%)', marginTop: '10px', height: '30px', fontSize: '15px', width: '240px' }} onClick={btnleavedata}>
                <div style={{ display: openLeaveLoding ? 'none' : '' }} className={Styles.top}>{appStore.userId ? '' : 'Connect Wallet'}</div>
                <div style={{ display: openLeaveLoding ? 'none' : '' }} className={Styles.buttom}>{appStore.userId ? `Confirm` : ''}</div>
              </LoadingButton>
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
})


export default DogMiner;
