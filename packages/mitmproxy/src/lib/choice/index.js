import LRU from "lru-cache";
const cacheSize = 1024;
import log from "../../utils/log";
export class ChoiceCache {
  constructor() {
    this.cache = new LRU(cacheSize);
  }

  get(key) {
    return this.cache.get(key);
  }

  getOrCreate(key, backups) {
    let item = this.cache.get(key);
    if (!item) {
      item = new DynamicChoice(key);
      item.setBackupList(backups);
      this.cache.set(key, item);
    }
    return item;
  }
}

export class DynamicChoice {
  constructor(key) {
    this.key = key;
    this.count = {};
    this.createTime = new Date();
  }

  doRank() {
    // 将count里面根据权重排序
    const list = [];
    // eslint-disable-next-line guard-for-in
    for (const key in this.count) {
      list.push(this.count[key]);
    }
    list.sort((a, b) => {
      return b.successRate - a.successRate;
    });
    log.info("do rank", JSON.stringify(list));
    const backup = list.map(item => item.value);

    this.setBackupList(backup);
  }

  /**
   * 设置新的backup列表
   * @param backupList
   */
  setBackupList(backupList) {
    this.backup = backupList;
    let defaultTotal = backupList.length;
    for (const item of backupList) {
      if (this.count[item]) {
        continue;
      }
      this.count[item] = {
        value: item,
        total: defaultTotal,
        error: 0,
        keepErrorCount: 0,
        successRate: 0.5
      };
      defaultTotal--;
    }
    this.value = backupList.shift();
    this.doCount(this.value, false);
  }

  countStart(value) {
    this.doCount(value, false);
  }

  /**
   * 换下一个
   * @param count
   */
  changeNext(count) {
    count.keepErrorCount = 0; // 清空连续失败
    if (this.backup > 0) {
      this.value = this.backup.shift();
    } else {
      this.value = null;
    }
  }

  /**
   * 记录使用次数或错误次数
   * @param value
   * @param isError
   */
  doCount(value, isError) {
    let count = this.count[value];
    if (!count) {
      count = this.count[value] = {
        value: value,
        total: 0,
        error: 0,
        keepErrorCount: 0,
        successRate: 1
      };
    }
    if (isError) {
      count.error++;
      count.keepErrorCount++;
    } else {
      count.total += 10;
    }
    count.successRate = 1.0 - count.error / count.total;
    if (isError && this.value === value) {
      // 连续错误10次，切换下一个
      if (count.keepErrorCount >= 10) {
        this.changeNext(count);
      }
      // 成功率小于50%,切换下一个
      if (count.successRate < 0.51) {
        this.changeNext(count);
      }
    }
  }
}
