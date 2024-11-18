import React, { useEffect, useRef, useState } from 'react';
import Styles from './index.module.less'
import { Box, InputBase, InputLabel, Modal, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import appStore from '@/store/app';
import { formatAmountByUnit } from '@/utils/common';
import tokenStore from '@/store/token';
import lefticon from '@/assets/header/titleleft.png'
import { create_alliance, canisterId, get_mining_alliances, get_mining_alliance, join_alliance, get_dogs, dog_info } from '@/api/bone_main';
import Big from 'big.js';
import { icrc1_decimals, icrc2_approve } from '@/api/bone';
import { Principal } from '@dfinity/principal';
import { DogContextOut, OutPoolInfo } from '@/canisters/bone_main/bone_main.did';
import { truncateString } from '@/utils/principal';
import Message from '@/components/Snackbar/message';
import SnackbarProgress, { SnackbarModalHandles } from '@/components/SnackbarProgress/SnackbarProgress';
import Copper from '@/assets/DogMiner/Copper.png'
import Gold from '@/assets/DogMiner/Gold.png'
import Silver from '@/assets/DogMiner/Silver.png'
import Diamond from '@/assets/DogMiner/Diamond.png'
import { cycles } from '@/api/bone_dog';
import { DogContext } from '@/canisters/bone_dog/bone_dog.did';
import CloseIcon from '@mui/icons-material/Close';
import share from '@/assets/header/share.png'
import copy from '@/assets/header/copy.png'
const CanisterDevelopersModalStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#212224',
  borderRadius: '8px',
  width: '320px',
  padding: '20px',
  outline: 'none',
}
const selectDogMineModalStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#212224',
  borderRadius: '8px',
  width: '680px',
  // height: '400px',
  padding: '20px',
  outline: 'none',
}
interface UserInfoProps {
  //message under components/Snackbar is no longer used
  onWellModal: (Param: Boolean) => void;
  openSelectWell: Boolean;
}
const DogAlliance = (props: UserInfoProps) => {
  const [createname, setcreatename] = useState<string>()
  const [CreateLoding, setCreateFomoLOding] = useState<boolean>(false)
  const [icpdecimals, seticpdecimals] = useState<number>()
  const [islodinginfo, setislodinginfo] = useState(true)
  const req_icrc1_decimals = async () => {
    const res = await icrc1_decimals()
    seticpdecimals(res)
  }
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
    const amount = new Big(200.1).times(new Big(10).pow(icpdecimals ? icpdecimals : 8)).plus(1).toString();
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
      req_create_alliance()
    }).catch((error) => {
      handleButtonClick(false)
      setCreateFomoLOding(false)
      Message.error('Create Dog Alliance Failed');
      console.log(error);
    })

  }
  const columns = [
    {
      title: 'Alliance Name',
      key: 'name'
    },
    {
      title: 'Alliance ID',
      key: 'id'
    },
    {
      title: 'Alliance Creator',
      key: 'owner'
    },
    {
      title: 'Dog Info',
      key: 'dogs_cnt'
    },
    {
      title: 'Mining Weight',
      key: 'mining_weight'
    },
    {
      title: 'Join Alliance',
      key: 'JoinAlliance'
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
  const req_create_alliance = async () => {
    try {
      const res = await create_alliance([createname!])
      if ('Err' in res) {
        Message.error('Create Dog Alliance Failed');
        console.log(res);
      } else {
        Message.success('Create Dog Alliance Successfully')
        req_get_mining_alliances()
      }
    } catch (err) {
      console.log(err);
    } finally {
      handleButtonClick(false)
      setCreateFomoLOding(false)
    }
  }
  const [all_alliances, setall_alliances] = useState<OutPoolInfo[]>([])
  const req_get_mining_alliances = async () => {
    setislodinginfo(true)
    setall_alliances([])
    await get_mining_alliances().then((res) => {
      res.forEach((item) => {
        get_mining_alliance([item]).then((res) => {
          setall_alliances((prevInfos) => {
            setislodinginfo(false)
            return [...prevInfos, res]
          })
        })
      })
    })
  }
  const req_join_alliance = async () => {
    try {
      const res = await join_alliance([curselectIteminfo.dog_id, curjoininfo!.id])
      if ('Err' in res) {
        Message.error('Join Dog Alliance Failed');
        console.log(res);
      } else {
        Message.success('Join Dog Alliance Successfully')
        setopentjoin(false)
        req_get_mining_alliances()
        req_get_dogs()
      }
    } catch (err) {
      console.log(err);
      Message.error('Join Dog Alliance Failed');
    } finally {
      handleButtonClick(false)
      setjoinLoding(false)
    }
  }
  const [opentjoin, setopentjoin] = useState(false)
  const [joinLoding, setjoinLoding] = useState(false)
  const [curjoininfo, setcurjoininfo] = useState<OutPoolInfo>()
  const handleopenjoin = () => {
    setopentjoin(false)
    setcurselectIteminfo(undefined)
  }
  const btnjoinmodal = (item: OutPoolInfo) => {
    if (!appStore.userId) {
      props.onWellModal(true);
      return
    }
    setcurjoininfo(item)
    setopentjoin(true)
  }
  const btnjoin = async () => {
    if (!curjoininfo || !curselectIteminfo) {
      Message.error('Please Select a Dog.');
      return
    }
    handleButtonClick(true, 'Join Dog Alliance in progress')
    const amount = new Big(10.1).times(new Big(10).pow(icpdecimals ? icpdecimals : 8)).plus(1).toString();
    setjoinLoding(true)
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
      req_join_alliance()
    }).catch((error) => {
      Message.error('Join Dog Alliance Failed');
      handleButtonClick(false)
      setjoinLoding(false)
      console.log(error);
    })
  }
  const snackbarRef = useRef<SnackbarModalHandles>(null);
  const handleButtonClick = (RightBox: boolean, text?: string) => {
    if (snackbarRef.current) {
      snackbarRef.current.openSnackbar(text ? text : 'Create Dog Alliance in progress', RightBox);
      snackbarRef.current.setViewProgress(true);
    }
  };
  const handleViewProgress = () => {
    console.log('');
  }
  const [openselectDogMinermodal, setopenselectDogMinermodal] = useState(true)
  const [curselectIteminfo, setcurselectIteminfo] = useState<DogContextOut>()
  const handleopenselectDogMinermodal = () => {
    setopenselectDogMinermodal(false)
  }
  const btnselectitem = (item: DogContextOut) => {
    if (curselectIteminfo && item.dog_id.toString() == curselectIteminfo.dog_id.toString()) {
      setcurselectIteminfo(undefined)
    } else {
      setcurselectIteminfo(item)
    }
  }
  const Imglevel = (item) => {
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
  const [dog_infos, setdog_infos] = useState<DogContextOut[]>([])
  const [dogcycles, setdogcycles] = useState()
  const req_get_dogs = async () => {
    const res = await dog_info([Principal.fromText(appStore.userId)]);
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
    req_icrc1_decimals()
    setTimeout(() => {
      req_get_mining_alliances()
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
              <div style={{ display: CreateLoding ? 'none' : '' }} className={Styles.top}>{appStore.userId ? 'Create a Dog Alliance' : 'Connect Wallet'}</div>
              <div style={{ display: CreateLoding ? 'none' : '' }} className={Styles.buttom}>{appStore.userId ? `Service Fees: 200 BONE` : ''}</div>
            </LoadingButton>
          </div>
        </div>
      </div>
      <div className={Styles.btm}>
        <div className={Styles.title}>
          <img src={lefticon} />
          <div className={Styles.text}>Alliance List</div>
        </div>
        {
          !islodinginfo ? all_alliances.length != 0 ?
            <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}>
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
                    all_alliances.map((item, index) => {
                      return (
                        <React.Fragment key={index}>
                          <TableRow
                            className={Styles.TableCellstyleTableRow}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 }, marginTop: '10px' }}
                          >
                            {
                              columns.map((columnsitem, index) => {
                                if (columnsitem.key == 'owner') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      <div className={Styles.copy}>
                                        <div> {truncateString(item[columnsitem.key].toString())}</div>
                                        <img src={share} style={{ width: '20px' }} onClick={() => getPrincipalDashboardURL(item[columnsitem.key].toString())} />
                                        <img src={copy} style={{ width: '20px' }} onClick={() => CanisterCopyBtnFn(item[columnsitem.key].toString())} />
                                      </div>
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'dogs_cnt') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {
                                        item[columnsitem.key].map((item) => {
                                          return (
                                            <div key={item}>{item}</div>
                                          )
                                        })
                                      }
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'JoinAlliance') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      <span style={{ color: '#F98C3F', cursor: 'pointer' }} onClick={() => btnjoinmodal(item)}>JOIN</span>
                                    </TableCell>
                                  )
                                } else {
                                  return (

                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[columnsitem.key].toString()}
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
            </TableContainer> :
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" color="textSecondary">
                No Data
              </Typography>
            </Box>
            :
            <div>
              <Skeleton variant="text" sx={{ bgcolor: '#212224', height: '48px' }} />
              <Skeleton variant="text" sx={{ bgcolor: '#212224', marginTop: '-10px', height: '48px', }} />
            </div>
        }
        <div className={Styles.tablephone}>
          {
            all_alliances.map((item, index) => {
              return (
                <div className={Styles.row} key={index}>
                  {
                    columns.map((columnsitem, index) => {
                      if (columnsitem.key == 'owner') {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value}>
                              <div className={Styles.copy}>
                                {truncateString(item[columnsitem.key].toString())}
                                <img src={share} onClick={() => getPrincipalDashboardURL(item[columnsitem.key].toString())} />
                                <img src={copy} onClick={() => CanisterCopyBtnFn(item[columnsitem.key].toString())} />
                              </div>
                            </div>
                          </div>
                        )
                      } else if (columnsitem.key == 'dogs_cnt') {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value}>
                              {
                                item[columnsitem.key].map((item) => {
                                  return (
                                    <div key={item}>{item}</div>
                                  )
                                })
                              }
                            </div>
                          </div>
                        )
                      } else if (columnsitem.key == 'JoinAlliance') {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value} onClick={() => btnjoinmodal(item)}>
                              <span style={{ color: '#F98C3F', cursor: 'pointer' }}>JOIN</span>
                            </div>
                          </div>
                        )
                      } else {
                        return (
                          <div className={Styles.tableItem} key={index}>
                            <div className={Styles.title}>
                              {columnsitem.title}
                            </div>
                            <div className={Styles.value}>
                              {item[columnsitem.key].toString()}
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
      <Modal open={opentjoin} className={Styles.openselectDogMinermodal} onClose={handleopenjoin}>
        <Box
          className={Styles.openselectDogMinermodalBox}
          sx={{
            ...selectDogMineModalStyles,
          }}>
          <div className={Styles.content}>
            <CloseIcon style={{ position: 'absolute', top: '20px', right: '20px', color: '#fff', cursor: "pointer" }} onClick={handleopenjoin}></CloseIcon>
            <div className={Styles.title}>
              Select Dog Miner
            </div>
            <div className={Styles.tablewarp}>
              {
                <Table className={Styles.table} aria-label="simple table">
                  <TableHead className={Styles.tableHead}>
                    <TableRow className={Styles.bgccolor}>
                      {
                        selectcolumns.map((item, index) => {
                          return <TableCell key={index} className={Styles.textcolor}>{item.title}</TableCell>
                        })
                      }
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {
                      dog_infos.map((item, index) => {
                        return (
                          <React.Fragment key={index}>
                            <TableRow
                              className={`${Styles.TableCellstyleTableRow} ${curselectIteminfo && item.dog_id ? curselectIteminfo.dog_id == item.dog_id ? Styles.active : '' : ''}`}
                              sx={{ '&:last-child td, &:last-child th': { border: 0 }, marginTop: '10px', display: Object.keys(item.mining_state)[0] == 'STOP' || Object.keys(item.mining_type)[0] != 'ALONE' ? 'none' : '' }}
                              onClick={() => btnselectitem(item)}
                            >
                              {
                                selectcolumns.map((columnsitem, index) => {
                                  if (columnsitem.key == 'name') {
                                    return (
                                      <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
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
                                  else if (columnsitem.key == 'dog_level') {
                                    return (
                                      <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                        {Object.keys(item[columnsitem.key])[0]}
                                      </TableCell>
                                    )
                                  } else if (columnsitem.key == 'cyclesres') {
                                    return (
                                      <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                        {dogcycles && dogcycles[item.dog_id.toString()] ? formatAmountByUnit(dogcycles[item.dog_id.toString()].toString()) : ''}
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
              }
            </div>
            <div className={Styles.selectItem}>
              Alliance lD: {curjoininfo?.id?.toString()}
            </div>
            <LoadingButton loading={joinLoding} className={Styles.selectbtn} sx={{ color: "#fff", backgroundImage: 'linear-gradient(235deg, #F98C3F 0%, #F98C3F 100%)', marginTop: '10px', height: '50px', fontSize: '15px', width: '400px' }} onClick={btnjoin}>
              <div className={Styles.top} style={{ display: joinLoding ? 'none' : '' }}>{appStore.userId ? '' : 'Connect Wallet'}</div>
              <div className={Styles.buttom} style={{ display: joinLoding ? 'none' : '' }}>{appStore.userId ? `Confirm to join this Dog Alliance` : ''}</div>
              <div className={Styles.buttom} style={{ display: joinLoding ? 'none' : '' }}>{appStore.userId ? `Service Fees: ≈ 10 BONE` : ''}</div>
            </LoadingButton>
          </div>
        </Box>
      </Modal>
    </div >
  );
};

export default DogAlliance;
