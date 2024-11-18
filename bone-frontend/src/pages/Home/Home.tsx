import React, { useEffect, useState } from 'react';
import Styles from './index.module.less'
import X from '@/assets/header/X.png'
import github from '@/assets/header/github.png'
import logo from '@/assets/header/logo.jpg'
import Shovel from '@/assets/header/Shovel.png'
import stats from '@/assets/header/stats.png'
import lefticon from '@/assets/header/titleleft.png'
import frommarkers from '@/assets/header/frommarkers.png'
import { get_homepage_calc, get_record_idx, get_record_index, time_until_next_having_days, canisterId as bone_main_canisterId, get_current_block_reward } from '@/api/bone_main';
import { HomepageCalcInfo, MRecord, RecordIndex } from '@/canisters/bone_main/bone_main.did';
import { bone_icrc1_balance_of, icrc1_decimals, icrc1_supported_standards, icrc1_total_supply } from '@/api/bone';
import { canisterId } from '@/api/bone'
import Big from 'big.js';
import { truncateString } from '@/utils/principal';
import { divideAndConvertToNumber, formatAmountByUnit } from '@/utils/common';
import { getICPPrice } from '@/api/ICPPrice';
import { Principal } from '@dfinity/principal';
import { useNavigate } from 'react-router-dom';
import share from '@/assets/header/share.png'
import copy from '@/assets/header/copy.png'
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'
import Message from '@/components/Snackbar/message';
dayjs.extend(utc)
const Home = () => {
  const navigate = useNavigate();
  const [startinfo, setstartinfo] = useState<HomepageCalcInfo>()
  const [startPrice, setsstartPrice] = useState<Array<[Principal, bigint]>>([])
  const statsinfo = {
    left: [
      {
        label: 'BONE Price(USD)',
        value: '*****'
      },
      {
        label: 'Total Number of Miners',
        value: '*****'
      },
      {
        label: 'Current Block Height',
        value: '*****'
      },
      {
        label: 'Current Block Reward',
        value: '*****'
      }
    ],
    right: [
      {
        label: 'Circulating BONE Supply',
        value: '*****'
      },
      {
        label: 'Current Active Miners',
        value: '*****'
      },
      {
        label: 'Block Time(UTC)',
        value: '*****'
      },
      {
        label: 'Time Until Next Halving(Days)',
        value: '88'
      }
    ]
  }
  const howworks = [
    {
      label: 'Governed by DAO',
      value: 'The project is entirely controlled in a decentralized manner by DOGMI DAO.3% of the $BONE token rewards earned by users through mining will be paid to the DOGMI DAO treasury to reserve funds for the project’s future development.'
    },
    {
      label: 'Mining Methods',
      value: 'Users can deploy one or more of their own DOG Miners. The initial DOG Miner is a Copper DOG Miner, which users can upgrade in various ways. Users can also form a DOG Alliance by having their DOG Miners work together with those of other users. '
    },
    {
      label: 'Miner Upgrade',
      value: 'Users can pay $BONE tokens to upgrade their Copper DOG Miner to either a Silver DOG Miner or a Gold DOG Miner. The DOG Miner with the highest mining weight is the Diamond DOG Miner, and notably, users will need to use $DOGMI tokens to perform upgrade operations.'
    },
    {
      label: 'Deflation Mechanism',
      value: 'The $BONE and $DOGMI tokens paid by users during the DOG Miner upgrade operations will be transferred to a black hole address and permanently destroyed. This will continuously reduce the total supply of $BONE and $DOGMI.'
    },
  ]
  const [currentblockheight, setcurrentblockheight] = useState<RecordIndex>()
  const btntolink = (link: string) => {
    window.open(link)
  }
  const reqget_homepage_calc = async (decimals: number) => {
    const res = await get_homepage_calc()
    const rew = await get_current_block_reward()
    setstartinfo({ ...res, block_reward: new Big(rew.toString()).div(new Big(10).pow(decimals)).toString() })
  }
  const [Circulating_BONE_Supply, setCirculating_BONE_Supply] = useState<string>()
  const [aa_Price, setaa_Price] = useState<string>()
  const reqicrc1_total_supply = async (decimals: number) => {
    const res = await icrc1_total_supply()
    setCirculating_BONE_Supply(new Big(res.toString()).div(new Big(10).pow(decimals)).toString())
    const aaa_aaaa = await bone_icrc1_balance_of([
      {
        owner: Principal.fromText('aaaaa-aa'),
        subaccount: [],
      }
    ])
    const bone_main_Price = await bone_icrc1_balance_of([
      {
        owner: Principal.fromText(bone_main_canisterId),
        subaccount: [],
      }
    ])
    setaa_Price(new Big(res.toString()).minus(aaa_aaaa.toString()).minus(bone_main_Price.toString()).div(new Big(10).pow(decimals)).toString())
  }

  const [bone_decimals, setbone_decimals] = useState<string>()
  const reqicrc1_decimals = async () => {
    const res = await icrc1_decimals()
    setbone_decimals(res.toString())
    return res
  }
  const req_get_record_idx = async () => {
    const res = await get_record_idx()
    setcurrentblockheight(res)
    return res
  }
  const [BlockTime, setBlockTime] = useState<Array<[bigint, MRecord]>>([])
  const req_get_record_index = async (hight: RecordIndex) => {
    const res = await get_record_index([hight.end_idx, BigInt(1)])
    setBlockTime(res)
  }
  const req_getICPPrice = async () => {
    const res = await getICPPrice([[Principal.fromText(canisterId)]])
    console.log(res);

    setsstartPrice(res)
  }
  const btnletgo = () => {
    navigate('/DogMiner')
  }
  const [having_days, sethaving_days] = useState<string>('')
  const req_time_until_next_having_days = async () => {
    const res = await time_until_next_having_days()
    sethaving_days(res.toString())
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
    req_getICPPrice()
    req_time_until_next_having_days()
    reqicrc1_decimals().then((res) => {
      reqicrc1_total_supply(res)
      reqget_homepage_calc(res)
    })
    req_get_record_idx().then((res) => {
      console.log(res);
      req_get_record_index(res)
    })
  }, [])
  return (
    <div className={Styles.Home}>
      <div className={Styles.disc}>
        <div className={Styles.disctop}>
          The First POW GameFi Mining Project on ICP
        </div>
        <div className={Styles.discCenter}>
          <div className={Styles.discCentertop}>Bark, Mine, and Shine</div>
          <div className={Styles.discCenterbtm}>Join the Doggo Mining Adventure</div>
        </div>
        <div className={Styles.btngo} onClick={btnletgo}>Let's Go</div>
        <div className={Styles.links}>
          <img src={X} onClick={() => btntolink('https://x.com/Bone_Fi')} />
          <img src={github} onClick={() => btntolink('https://github.com/Dogmidogfinity')} />
        </div>
      </div>
      <div className={Styles.boneinfo}>
        <div className={Styles.boneinfoLeft}>
          <div className={Styles.logogroup}>
            <img className={Styles.logo} src={logo} />
            <div className={Styles.text}>BONE</div>
          </div>
          <div className={Styles.carinfo}>
            <div className={Styles.carinfoItem}>
              <span className={Styles.label}>Token Standard: </span>
              <span className={Styles.value}>ICRC-2</span>
            </div>
            <div className={Styles.carinfoItem}>
              <span className={Styles.label}>Canister ID:  </span>
              <span className={Styles.value}>{truncateString(canisterId)}</span>
              <img src={share} onClick={() => getPrincipalDashboardURL(canisterId)} />
              <img src={copy} onClick={() => CanisterCopyBtnFn(canisterId)} />
            </div>
            <div className={Styles.carinfoItem}>
              <span className={Styles.label}>Total Supply: </span>
              <span className={Styles.value}>{formatAmountByUnit(Circulating_BONE_Supply)}</span>
            </div>
          </div>
        </div>
        <img src={Shovel} className={Styles.boneinfoRight}></img>
      </div>
      <div className={Styles.stats}>
        <img src={stats} className={Styles.statsleft}></img>
        <div className={Styles.statsright}>
          <div className={Styles.top}>
            <img src={lefticon} />
            <div className={Styles.text}>STATS</div>
          </div>

          <div className={Styles.btm}>
            <div className={Styles.statinfoleft}>
              {
                statsinfo.left.map((item) => {
                  if (item.label == 'Current Block Reward') {
                    return (
                      <div className={Styles.statsItem} key={item.label}>
                        <div className={Styles.statsLabel}>{item.label}</div>
                        <div className={Styles.statsValue}>{startinfo?.block_reward.toString()}</div>
                      </div>
                    )
                  } else if (item.label == 'Total Number of Miners') {
                    return (
                      <div className={Styles.statsItem} key={item.label}>
                        <div className={Styles.statsLabel}>{item.label}</div>
                        <div className={Styles.statsValue}>{startinfo?.total_number_of_minder.toString()}</div>
                      </div>
                    )
                  } else if (item.label == 'Current Block Height') {
                    return (
                      <div className={Styles.statsItem} key={item.label}>
                        <div className={Styles.statsLabel}>{item.label}</div>
                        <div className={Styles.statsValue}>{currentblockheight?.end_idx.toString()}</div>
                      </div>
                    )
                  } else if (item.label == 'BONE Price(USD)') {
                    return (
                      <div className={Styles.statsItem} key={item.label}>
                        <div className={Styles.statsLabel}>{item.label}</div>
                        <div className={Styles.statsValue}>{startPrice[0] ? formatAmountByUnit(new Big(startPrice[0][1].toString()).div(new Big(10).pow(18)).toString()) : '*******'}</div>
                      </div>
                    )
                  }
                  else {
                    return (
                      <div className={Styles.statsItem} key={item.label}>
                        <div className={Styles.statsLabel}>{item.label}</div>
                        <div className={Styles.statsValue}>{item.value}</div>
                      </div>
                    )
                  }

                })
              }
            </div>
            <div className={Styles.statinforight}>
              {
                statsinfo.right.map((item) => {
                  if (item.label == 'Current Active Miners') {
                    return (
                      <div className={Styles.statsItem} key={item.label}>
                        <div className={Styles.statsLabel}>{item.label}</div>
                        <div className={Styles.statsValue}>{startinfo?.current_avtive_minders.toString()}</div>
                      </div>
                    )
                  } else if (item.label == 'Circulating BONE Supply') {
                    return (
                      <div className={Styles.statsItem} key={item.label}>
                        <div className={Styles.statsLabel}>{item.label}</div>
                        <div className={Styles.statsValue}>{formatAmountByUnit(aa_Price)}</div>
                      </div>
                    )
                  } else if (item.label == 'Block Time(UTC)') {
                    return (
                      <div className={Styles.statsItem} key={item.label}>
                        <div className={Styles.statsLabel}>{item.label}</div>
                        <div className={Styles.statsValue}>{BlockTime[0] ? dayjs(new Big(BlockTime[0][1].utc.toString()).div(10 ** 6).toNumber()).utc().format('YYYY/MM/DD HH:mm:ss') : '*******'}</div>
                      </div>
                    )
                  } else if (item.label == 'Time Until Next Halving(Days)') {
                    return (
                      <div className={Styles.statsItem} key={item.label}>
                        <div className={Styles.statsLabel}>{item.label}</div>
                        <div className={Styles.statsValue}>{having_days}</div>
                      </div>
                    )
                  }
                  else {
                    return (
                      <div className={Styles.statsItem} key={item.label}>
                        <div className={Styles.statsLabel}>{item.label}</div>
                        <div className={Styles.statsValue}>{item.value}</div>
                      </div>
                    )
                  }
                })
              }
            </div>
          </div>

        </div>
      </div>
      <div className={Styles.howworks}>
        <div className={Styles.howworkstop}>
          <img src={lefticon} />
          <div className={Styles.text}>HOW BONE WORKS</div>
        </div>
        <div className={Styles.howworksbtm}>
          {
            howworks.map((item) => {
              return (
                <div className={Styles.item} key={item.label}>
                  <div className={Styles.label}>{item.label}</div>
                  <div className={Styles.value}>{item.value}</div>
                </div>
              )
            })
          }
        </div>
      </div>
      <div className={Styles.btmfrommarkers}>
        <img src={frommarkers} />
      </div>
    </div>
  );
};

export default Home;
