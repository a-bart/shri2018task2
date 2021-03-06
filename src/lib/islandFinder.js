import * as Promise from 'bluebird';

export default class IslandFinder {
  constructor(matrix, delay = 0) {
    this.matrix = matrix;
    this.islands = [];
    this.currentPosition = [];
    this.checked = [];
    this.findingDelay = delay;
    this.stopped = false;
  }

  validateMap() {
    if (!(this.matrix && Array.isArray(this.matrix) && this.matrix.length > 0)) {
      throw new Error('Карта не задана');
    }

    if (!(this.matrix.every(row => Array.isArray(row)))) {
      throw new Error('Карта должна быть двумерным массивом');
    }

    this.matrix.some((row, index) => {
      if (row.length === 0) {
        throw new Error(`Строка ${index+1} карты должна содержать хотя бы один элемент`);
      }
    });

    if (!this.matrix.reduce((a, b) => (a.length === b.length) ? a : NaN )) {
      throw new Error('Все строки карты должны быть равной длины');
    }

    this.matrix.some((x, indexX) => {
      if (this.matrix[indexX].some((y, indexY) => {
          return !(this.matrix[indexX][indexY] === 0 || this.matrix[indexX][indexY] === 1);
        })) {
        throw new Error('Все элементы карты должны быть равны либо 0, либо 1');
      }
    });
  }

  /**
   * Если уже есть хотя бы один найденный остров,
   * проверяем переданный элемент на наличие в островах.
   * Если элемент найден, пропускаем его проверку
   * @param x
   * @param y
   * @returns {boolean}
   */
  checkIfNodeIsInIsland(x, y) {
    const checkIslandElements = (islandIndex) => {
      return this.islands[islandIndex].some(el => el[0] === x && el[1] === y);
    };

    if (this.islands.length > 0) {
      return this.islands.some((island, index) => checkIslandElements(index));
    }
    return false;
  }

  /**
   * Проверяем правый, нижний (если попали с найденного острова - то и левый, верхний) элементы
   * @param {number} x
   * @param {number} y
   * @param {number} islandIndex - индекс найденного острова
   */
  checkNode(x, y, islandIndex) {
    // Если элемент уже проверялся, пропускаем...
    if (this.checked.some(el => el[0] === x && el[1] === y)) {
      return;
    }

    console.log(`текущая позиция: ${x} ${y}`);
    this.currentPosition = [x, y];

    let newIslandIndex = null;
    let index = null;

    // Если элемент уже находится в острове. пропускаем...
    if (this.checkIfNodeIsInIsland(x, y)) {
      return;
    }

    // проверяем сам элемент
    if (this.matrix[x][y] === 1) {
      if (islandIndex !== undefined) {
        this.islands[islandIndex].push([x, y]);
      } else {
        this.islands.push([[x, y]]);
        newIslandIndex = this.islands.length - 1;
      }

      index = islandIndex === undefined ? newIslandIndex : islandIndex;

      // проверяем правый, если не уперлись в правый бок карты
      if (y < this.matrix[0].length - 1) {
        this.checkNode(x, y+1, index)
      }

      // проверяем левый, если не уперлись в левый бок карты
      // и передан текущий остров
      if (islandIndex !== undefined  && y > 0) {
        this.checkNode(x, y-1, index)
      }

      // проверяем нижний, если не уперлись в низ карты
      if (x < this.matrix.length - 1) {
        this.checkNode(x+1, y, index)
      }

      // проверяем верхний, если не уперлись в верх карты,
      // если передан текущий остров и текущий элемент смещен
      // по горизонтали относительно первого элемента в острове
      if (x > 0 && islandIndex !== undefined && this.islands[islandIndex][0][1] !== y) {
        this.checkNode(x-1, y, index)
      }
    }

    this.checked.push([x, y]);
  }

  /**
   * Проверяем правый, нижний (если попали с найденного острова - то и левый, верхний) элементы.
   * Метод используется при поиске с анимацией (с таймером)
   * @param {number} x
   * @param {number} y
   * @param {number} islandIndex - индекс найденного острова
   */
  checkNodeAsync(x, y, islandIndex) {
    if (this.stopped) {
      throw new Error('stopped');
    }

    // Если элемент уже проверялся, пропускаем...
    if (this.checked.some(el => el[0] === x && el[1] === y)) {
      return;
    }

    // добавляем элемент чтобы следить за текущей позицией
    console.log(`текущая позиция: ${x} ${y}`);
    this.currentPosition = [x, y];

    let newIslandIndex = null;
    let index = null;

    return new Promise((resolve, reject) => {
      // Если элемент уже находится в острове. пропускаем...
      if (this.checkIfNodeIsInIsland(x, y)) {
        return resolve();
      }

      setTimeout(async () => {
        // проверяем сам элемент
        if (this.matrix[x][y] === 1) {
          if (islandIndex !== undefined) {
            this.islands[islandIndex].push([x, y]);
          } else {
            this.islands.push([[x, y]]);
            newIslandIndex = this.islands.length - 1;
          }

          index = islandIndex === undefined ? newIslandIndex : islandIndex;

          try {
            // проверяем правый, если не уперлись в правый бок карты
            if (y < this.matrix[0].length - 1) {
              await this.checkNodeAsync(x, y+1, index)
            }

            // проверяем левый, если не уперлись в левый бок карты
            // и передан текущий остров
            if (islandIndex !== undefined && y > 0) {
              await this.checkNodeAsync(x, y-1, index)
            }

            // проверяем нижний, если не уперлись в низ карты
            if (x < this.matrix.length - 1) {
              await this.checkNodeAsync(x+1, y, index)
            }

            // проверяем верхний, если не уперлись в верх карты,
            // если передан текущий остров и текущий элемент смещен
            // по горизонтали относительно первого элемента в острове
            if (x > 0 && islandIndex !== undefined && this.islands[islandIndex][0][1] !== y) {
              await this.checkNodeAsync(x-1, y, index)
            }
          } catch (err) {
            reject(err);
          }
        }
        this.checked.push([x, y]);
        resolve()
      }, this.findingDelay);
    });
  }

  find() {
    // проверка карты
    this.validateMap();

    this.matrix.forEach((row, x) => {
      this.matrix[x].forEach((element, y) => this.checkNode(x, y))
    })
  }

  async findAsync() {
    // проверка карты
    this.validateMap();

    try {
      await Promise.each(this.matrix, async (row, x) => {
        await Promise.each(this.matrix[x], async (element, y) => this.checkNodeAsync(x, y));
      });
    } catch (err) {
      console.error('err: ', err.message);
      throw err;
    }
  }

  stop() {
    this.stopped = true;
  }
}
