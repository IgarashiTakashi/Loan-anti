'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {
 //初始化智能合约的方法
  async Init(stub) {
    console.info('=========== Instantiated loan chaincode ===========');
    return shim.success();
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters(); //获取函数和参数
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.error('找不到要调用的函数,函数名:' + ret.fcn);
      throw new Error('找不到要调用的函数,函数名:' + ret.fcn);
    }
    try {
      let payload = await method(stub, ret.params); //直接调用函数,获取返回值
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

 
 async queryLoan(stub, args) {
    if (args.length != 1) {
      throw new Error('错误的调用参数. 实例: LOAN01');
    }
    let loanNumber = args[0];

    let loanAsBytes = await stub.getState(loanNumber); //从账本中获取loan的信息,账本是二进制存储的
    if (!loanAsBytes || loanAsBytes.toString().length <= 0) {
      throw new Error(loanAsBytes + ' 不存在: ');
    }
    console.log(loanAsBytes.toString());
    return loanAsBytes;
  }

 
async initLedger(stub, args) {
    console.info('============= 开始 : 初始化账本 ===========');
    let loanes = [];
    loanes.push({
        userID: "0x667cC6A90F69b565b8D1b3BD5Fc73312906B139c",
        timestamp: "201806180000",
        loanmoney: "50000",
        applydate: "2018-06-18" ,
        startdate: "2018-06-19",
        enddate: "2019-06-19",
    });
    loanes.push({
        userID: "0x93c38882b1458da130B40Cc2c3620F28243B4540",
        timestamp: "201806180001",
        loanmoney: "100000",
        applydate: "2018-07-18" ,
        startdate: "2018-07-19",
        enddate: "2019-07-19",
    });

    for (let i = 0; i < loanes.length; i++) {
      await stub.putState('LOAN' + i, Buffer.from(JSON.stringify(loanes[i])));
      console.info('Added <--> ',loanes[i]);
    }
    console.info('============= 结束 :初始化账本 ===========');
  }

 
 async recordLoan(stub, args) {
    console.info('============= START : record loan ===========');
    if (args.length != 7) {
      throw new Error('需要7个参数,第0个参数是id,后面的6个参数,userID,timestamp,loanmoney,applydate,startdate,enddate');
    }

    var loan = {
        userID: args[1],
        timestamp: args[2],
        loanmoney: args[3],
        applydate: args[4],
        startdate: args[4],
        enddate: args[4]
    };

    await stub.putState(args[0], Buffer.from(JSON.stringify(loan)));
    console.info('============= END : record loan ===========');
  }

async queryAllLoan(stub, args) {

    let startKey = 'LOAN0';
    let endKey = 'LOAN9999';

    let iterator = await stub.getStateByRange(startKey, endKey);

    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }


}
shim.start(new Chaincode());
