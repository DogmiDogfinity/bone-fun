import React, { useEffect, useState } from 'react';
import Styles from './index.module.less'
import { Box, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, Tabs, Pagination, PaginationItem } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import tableicon from '@/assets/DogMiner/tablelogo.png'
import well from '@/assets/DogMiner/wallet.png'
import { title } from 'process';
import { get_record_idx, get_record_index, get_record_rev, top_alliance, top_user } from '@/api/bone_main';
import { Principal } from '@dfinity/principal';
import { MRecord, RecordIndex } from '@/canisters/bone_main/bone_main.did';
import Big from 'big.js';
import dayjs from 'dayjs';
import { truncateString } from '@/utils/principal';
import { icrc1_decimals } from '@/api/bone';
const Dashboard = () => {
  const [value, setValue] = useState<string>('1');
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  type TopUserKeys = 'PrincipalID' | 'DiamondDog' | 'GoldDog' | 'SilverDog' | 'CooperDog' | 'BlockMined';
  type TopAlliances = 'AllianceName' | 'AllianceID' | 'DiamondDog' | 'GoldDog' | 'SilverDog' | 'CooperDog' | 'BlockMined';
  type BlockInfoKeys = 'MinerID' | 'AllianceID' | 'Rewards' | 'Time' | 'BlockHeight' | 'MinerCyclesBurned' | 'TotalCyclesBurned';
  const columns = {
    'TopUser': [
      {
        title: 'Principal ID',
        key: 'PrincipalID'
      },
      {
        title: 'Diamond Dog',
        key: 'DiamondDog'
      },
      {
        title: 'Gold Dog',
        key: 'GoldDog'
      },
      {
        title: 'Silver Dog',
        key: 'SilverDog'
      },
      {
        title: 'Cooper Dog',
        key: 'CooperDog'
      },
      {
        title: 'Block Mined',
        key: 'BlockMined'
      }
    ],
    'TopAlliance': [
      {
        title: 'Alliance Name',
        key: 'AllianceName'
      },
      {
        title: 'Alliance ID',
        key: 'AllianceID'
      },
      {
        title: 'Diamond Dog',
        key: 'DiamondDog'
      },
      {
        title: 'Gold Dog',
        key: 'GoldDog'
      },
      {
        title: 'Silver Dog',
        key: 'SilverDog'
      },
      {
        title: 'Cooper Dog',
        key: 'CooperDog'
      },
      {
        title: 'Block Mined',
        key: 'BlockMined'
      }
    ],
    'BlockInfo': [
      {
        title: 'Miner ID',
        key: 'MinerID',
      },
      {
        title: 'Alliance ID',
        key: 'AllianceID',
      },
      {
        title: 'Rewards',
        key: 'Rewards'
      },
      {
        title: 'Time(UTC)',
        key: 'Time'
      },
      {
        title: 'Block Height',
        key: 'BlockHeight'
      },
      // {
      //   title: 'Miner Cycles Burned',
      //   key: 'MinerCyclesBurned'
      // },
      // {
      //   title: 'Total Cycles Burned',
      //   key: 'TotalCyclesBurned'
      // }
    ]
  }
  const dataSource = {
    'TopUser': [
      {
        PrincipalID: '*****',
        DiamondDog: '212121',
        GoldDog: '123123',
        SilverDog: '123123',
        CooperDog: '1231231',
        BlockMined: '1312312'
      },
      {
        PrincipalID: '*****',
        DiamondDog: '212121',
        GoldDog: '123123',
        SilverDog: '123123',
        CooperDog: '1231231',
        BlockMined: '1312312'
      },
    ],
    'TopAlliance': [
      {
        AllianceName: '*****',
        AllianceID: '212121',
        DiamondDog: '123123',
        GoldDog: '123123',
        SilverDog: '1231231',
        CooperDog: '1312312',
        BlockMined: '13212312'
      },
    ],
    'BlockInfo': [
      {
        MinerID: '*****',
        AllianceID: '212121',
        Rewards: '123123',
        Time: '123123',
        BlockHeight: '1231231',
        MinerCyclesBurned: '1312312',
        TotalCyclesBurned: '13212312'
      },
    ]
  }
  const [topuser, settopuser] = useState<Array<[Principal, bigint, bigint, bigint, bigint, bigint]>>([])
  const [topalliance, settop_alliance] = useState<Array<[string, bigint, bigint, bigint, bigint, bigint, bigint]>>([])
  const [blockinfo, setblockinfo] = useState<Array<[bigint, MRecord]>>([])
  const req_top_user = async () => {
    const res = await top_user()
    settopuser(res)
  }
  const req_top_alliance = async () => {
    const res = await top_alliance()
    settop_alliance(res)
  }
  const [maxindex, setmaxindex] = useState<number>()
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const req_get_record_idx = async () => {
    const res = await get_record_idx()
    setmaxindex(Number(res.end_idx))
    return res
  }
  const fetchPageData = async (start: bigint, limit: bigint) => {
    const pageData = await get_record_rev([start, limit]);
    setblockinfo(pageData);
  };
  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
    const start = newPage * rowsPerPage;
    fetchPageData(BigInt(start), BigInt(rowsPerPage));
  };
  const handleChangePagephone = (event: object, page: number) => {
    setPage(page - 1);
    const start = (page - 1) * rowsPerPage;
    console.log(start, rowsPerPage);

    fetchPageData(BigInt(start), BigInt(rowsPerPage));
  }
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchPageData(BigInt(0), BigInt(newRowsPerPage));
  };
  const req_get_record_index = async (hight: RecordIndex) => {
    const res = await get_record_rev([hight.end_idx, BigInt(1)])
    setblockinfo(res)
  }
  const [bonedecimals, setbonedecimals] = useState(8)
  const req_bone_icrc1_decimals = async () => {
    const res = await icrc1_decimals()
    setbonedecimals(res)
  }
  useEffect(() => {
    req_top_user()
    req_top_alliance()
    req_get_record_idx()
    fetchPageData(BigInt(0), BigInt(5))
    req_bone_icrc1_decimals()
  }, [])
  return (
    <div className={Styles.page}>
      <TabContext value={value}>
        <Box className={Styles.headertab} sx={{ borderBottom: 1, borderColor: 'divider' }} >
          <TabList onChange={handleChange} aria-label="lab API tabs example" centered TabIndicatorProps={{
            sx: {
              display: 'none'
            },
          }}>
            <Tab className={Styles.tabItem} label="Top User" sx={{
              color: value == '1' ? '#F98C3F !important' : '#fff',
              fontWeight: value == '1' ? 'bold' : 'normal',
            }} value="1" />
            <Tab className={Styles.tabItem} sx={{
              color: value == '2' ? '#F98C3F !important' : '#fff',
              fontWeight: value == '2' ? 'bold' : 'normal',
            }} label="Top Alliance" value="2" />
            <Tab className={Styles.tabItem} sx={{
              color: value == '3' ? '#F98C3F !important' : '#fff',
              fontWeight: value == '3' ? 'bold' : 'normal',
            }} label="Block Info" value="3" />
          </TabList>
        </Box>
        <TabPanel className={Styles.TabPanelclass} value="1">
          <div className={Styles.tablewarp}>
            <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}>
              <Table className={Styles.table} sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead className={Styles.tableHead}>
                  <TableRow className={Styles.bgccolor}>
                    {
                      columns.TopUser.map((item, index) => {
                        return <TableCell key={index} className={Styles.textcolor}>{item.title}</TableCell>
                      })
                    }
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    topuser.map((item, index) => {
                      return (
                        <React.Fragment key={index}>
                          <TableRow
                            className={Styles.TableCellstyleTableRow}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 }, marginTop: '10px' }}
                          >
                            {
                              columns.TopUser.map((columnsitem, index) => {
                                if (columnsitem.key == 'PrincipalID') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {truncateString(item[0].toString())}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'DiamondDog') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[4].toString()}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'SilverDog') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[2].toString()}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'CooperDog') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[1].toString()}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'BlockMined') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[5].toString()}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'GoldDog') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[3].toString()}
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
            </TableContainer>
          </div>
          <div className={Styles.tablephone}>
            {
              topuser.map((item, index) => {
                return (
                  <div className={Styles.row} key={index}>
                    {
                      columns.TopUser.map((columnsitem, index) => {
                        if (columnsitem.key == 'PrincipalID') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {truncateString(item[0].toString())}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'DiamondDog') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[4].toString()}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'SilverDog') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[2].toString()}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'CooperDog') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[1].toString()}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'BlockMined') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[5].toString()}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'GoldDog') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[3].toString()}
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
        </TabPanel>
        <TabPanel className={Styles.TabPanelclass} value="2">
          <div className={Styles.tablewarp}>
            <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}>
              <Table className={Styles.table} sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead className={Styles.tableHead}>
                  <TableRow className={Styles.bgccolor}>
                    {
                      columns.TopAlliance.map((item, index) => {
                        return <TableCell key={index} className={Styles.textcolor}>{item.title}</TableCell>
                      })
                    }
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    topalliance.map((item, index) => {
                      return (
                        <React.Fragment key={index}>
                          <TableRow
                            className={Styles.TableCellstyleTableRow}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 }, marginTop: '10px' }}
                          >
                            {
                              columns.TopAlliance.map((columnsitem, index) => {
                                if (columnsitem.key == 'AllianceName') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[0] ? item[0].toString() : ''}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'AllianceID') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[1] ? item[1].toString() : ''}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'DiamondDog') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[5] ? item[5].toString() : '0'}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'GoldDog') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[4] ? item[4].toString() : '0'}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'SilverDog') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[3] ? item[3].toString() : '0'}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'CooperDog') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[2] ? item[2].toString() : '0'}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'BlockMined') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[6] ? item[6].toString() : '0'}
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
            </TableContainer>
          </div>
          <div className={Styles.tablephone}>
            {
              topalliance.map((item, index) => {
                return (
                  <div className={Styles.row} key={index}>
                    {
                      columns.TopAlliance.map((columnsitem, index) => {
                        if (columnsitem.key == 'AllianceName') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[0] ? item[0].toString() : ''}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'AllianceID') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[1] ? item[1].toString() : ''}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'DiamondDog') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[5] ? item[5].toString() : '0'}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'GoldDog') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[4] ? item[4].toString() : '0'}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'SilverDog') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[3] ? item[3].toString() : '0'}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'CooperDog') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[2] ? item[2].toString() : '0'}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'BlockMined') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[6] ? item[6].toString() : '0'}
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
        </TabPanel>
        <TabPanel className={Styles.TabPanelclass} value="3">
          <div className={Styles.tablewarp}>
            <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}>
              <Table className={Styles.table} sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead className={Styles.tableHead}>
                  <TableRow className={Styles.bgccolor}>
                    {
                      columns.BlockInfo.map((item, index) => {
                        return <TableCell key={index} className={Styles.textcolor}>{item.title}</TableCell>
                      })
                    }
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    blockinfo.map((item, index) => {
                      return (
                        <React.Fragment key={index}>
                          <TableRow
                            className={Styles.TableCellstyleTableRow}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 }, marginTop: '10px' }}
                          >
                            {
                              columns.BlockInfo.map((columnsitem, index) => {
                                if (columnsitem.key == 'MinerID') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[1]['dog_canister'].toString()}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'AllianceID') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[1]['alliance_id'] ? item[1]['alliance_id'].toString() : ''}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'Rewards') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {new Big(item[1]['reward_amount'].toString()).div(new Big(10).pow(bonedecimals)).toString()}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'Time') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {dayjs(new Big(item[1]['utc'].toString()).div(10 ** 6).toNumber()).utc().format('YYYY/MM/DD HH:mm:ss')}
                                    </TableCell>
                                  )
                                } else if (columnsitem.key == 'BlockHeight') {
                                  return (
                                    <TableCell key={index} className={Styles.TableCellstyle} component="th" scope="row">
                                      {item[1]['high'].toString()}
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
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      colSpan={columns.BlockInfo.length}
                      count={maxindex ? maxindex : 0}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      sx={{
                        color: '#fff',
                        border: '0',
                        '& .MuiTablePagination-toolbar': {
                          justifyContent: 'flex-end',
                        },
                      }}
                    />
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </div>
          <div className={Styles.tablephone}>
            {
              blockinfo.map((item, index) => {
                return (
                  <div className={Styles.row} key={index}>
                    {
                      columns.BlockInfo.map((columnsitem, index) => {
                        if (columnsitem.key == 'MinerID') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[1]['dog_canister'].toString()}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'AllianceID') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[1]['alliance_id'] ? item[1]['alliance_id'].toString() : ''}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'Rewards') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {new Big(item[1]['reward_amount'].toString()).div(new Big(10).pow(bonedecimals)).toString()}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'Time') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {dayjs(new Big(item[1]['utc'].toString()).div(10 ** 6).toNumber()).utc().format('YYYY/MM/DD HH:mm:ss')}
                              </div>
                            </div>
                          )
                        } else if (columnsitem.key == 'BlockHeight') {
                          return (
                            <div className={Styles.tableItem} key={index}>
                              <div className={Styles.title}>
                                {columnsitem.title}
                              </div>
                              <div className={Styles.value}>
                                {item[1]['high'].toString()}
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
            <Pagination
              count={maxindex ? Math.ceil(maxindex / rowsPerPage) : 0}
              page={page + 1}
              onChange={handleChangePagephone}
              variant="text"
              renderItem={(item) => (
                <PaginationItem
                  {...item}
                  sx={{
                    color: '#fff',
                    margin: '0 0px',
                    '&.Mui-selected': {
                      backgroundColor: '#fff',
                      color: '#000',
                    },
                  }}
                />
              )}
              sx={{
                color: '#fff !important',
                marginTop: '10px',
                '& .MuiPagination-ul': {
                  justifyContent: 'flex-end',
                },
                '& .MuiPaginationItem-root': {
                  color: '#fff',
                  borderColor: '#fff',
                },
                '& .Mui-selected': {
                  backgroundColor: '#fff !important',
                  color: '#000',
                },
              }}
            />
          </div>
        </TabPanel>
      </TabContext>
    </div>
  );
};

export default Dashboard;
