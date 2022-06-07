import { debounce } from './helper.js';

class CryptocurrencyConverter {
  constructor() {
    this._init();

    const converterContainer = document.getElementById(
      'cryptocurrency-converter'
    );
    const exchangeCurrencyButton = document.getElementById('exchange-button');

    converterContainer.addEventListener('click', (e) => {
      const searchBoxWrapper = e.target.closest('.search-box-wrapper');
      if (!searchBoxWrapper) return;

      const direction = searchBoxWrapper.id;
      this._search.call(this, direction, true);
      searchBoxWrapper.innerHTML = this._inputTemplate(direction);

      const searchBox = searchBoxWrapper.querySelector('.search-box');
      searchBox.focus();
      searchBox.select();
      searchBox.addEventListener(
        'keydown',
        debounce(this._search.bind(this, direction, false), 200)
      );
    });

    converterContainer.addEventListener(
      'keydown',
      debounce((e) => {
        const amountInput = e.target.closest('.amount-input');
        if (!amountInput) return;

        const direction = amountInput.id === 'amount' ? 'forward' : 'backward';
        this._convert(direction);
      }, 200)
    );

    exchangeCurrencyButton.addEventListener(
      'click',
      this._swapCurrency.bind(this)
    );

    window.addEventListener('click', (e) => {
      const searchResultContainerFrom = document.getElementById(
        'from-currency-search-result'
      );
      const searchResultContainerTo = document.getElementById(
        'to-currency-search-result'
      );

      if (!searchResultContainerFrom.contains(e.target)) {
        if (!searchResultContainerFrom.classList.contains('hide')) {
          searchResultContainerFrom.classList.add('hide');
        }
      }

      if (!searchResultContainerTo.contains(e.target)) {
        if (!searchResultContainerTo.classList.contains('hide')) {
          searchResultContainerTo.classList.add('hide');
        }
      }
    });
  }

  _init() {
    fetch('https://api.coingecko.com/api/v3/search?query=');

    const bitcoin = new Map([
      ['id', 'bitcoin'],
      ['name', 'Bitcoin'],
      [
        'imageSrc',
        'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png?1547033579',
      ],
    ]);

    const tether = new Map([
      ['id', 'tether'],
      ['name', 'Tether'],
      [
        'imageSrc',
        'https://assets.coingecko.com/coins/images/325/thumb/tether.png?1547034089',
      ],
    ]);

    document.getElementById('from').innerHTML = '';
    document.getElementById('from').innerHTML = this._selectedCoinTemplate(
      bitcoin.get('id'),
      bitcoin.get('name'),
      bitcoin.get('imageSrc')
    );

    document.getElementById('to').innerHTML = '';
    document.getElementById('to').innerHTML = this._selectedCoinTemplate(
      tether.get('id'),
      tether.get('name'),
      tether.get('imageSrc')
    );

    this._convert('forward');
  }

  _swapCurrency() {
    const tempCurrency = document.querySelector('#from').innerHTML;
    document.querySelector('#from').innerHTML =
      document.querySelector('#to').innerHTML;
    document.querySelector('#to').innerHTML = tempCurrency;
    this._convert('forward');
  }

  _search(direction, default_search) {
    let query = '';
    if (!default_search) {
      query = document.getElementById(`${direction}-currency`).value;
    }
    const searchResultContainer = document.querySelector(
      `#${direction}-currency-search-result`
    );

    if (query || default_search) {
      const apiUrl = `https://api.coingecko.com/api/v3/search?query=${query}`;
      fetch(apiUrl)
        .then((response) => response.json())
        .then((json) => {
          searchResultContainer.classList.remove('hide');
          searchResultContainer.innerHTML = '';

          const searchResults = json.coins.slice(0, 10);
          searchResults.forEach((coin) => {
            searchResultContainer.innerHTML += this._liTemplate(
              coin.id,
              coin.name,
              coin.thumb
            );
          });

          searchResultContainer.addEventListener('click', (e) => {
            const searchItem = e.target.closest('.search-item');
            if (!searchItem) return;

            const coinId = searchItem.querySelector('.currency-id').innerHTML;
            const coinName =
              searchItem.querySelector('.currency-name').innerHTML;
            const coinImage =
              searchItem.querySelector('.currency-image').firstElementChild.src;

            document.getElementById(direction).innerHTML = '';
            document.getElementById(direction).innerHTML =
              this._selectedCoinTemplate(coinId, coinName, coinImage);

            if (!searchResultContainer.classList.contains('hide')) {
              searchResultContainer.classList.add('hide');
            }
            this._convert('forward');
          });
        });
    }
  }

  _convert(direction) {
    let from, to, amount, result;
    if (direction === 'backward') {
      from = 'to';
      to = 'from';
      result = 'amount';
      amount = 'result';
    } else if (direction === 'forward') {
      from = 'from';
      to = 'to';
      result = 'result';
      amount = 'amount';
    }

    document.getElementById(`${result}`).value = '';
    const fromCurrency = document.querySelector(`#${from} .currency-id`);
    const toCurrency = document.querySelector(`#${to} .currency-id`);

    if (fromCurrency && toCurrency) {
      const fromCurrencyData = fetch(
        'https://api.coingecko.com/api/v3/coins/' + fromCurrency.innerHTML
      ).then((response) => {
        return response.json();
      });

      const toCurrencyData = fetch(
        'https://api.coingecko.com/api/v3/coins/' + toCurrency.innerHTML
      ).then((response) => {
        return response.json();
      });

      Promise.all([fromCurrencyData, toCurrencyData]).then((values) => {
        const [fromCurrencyJSON, toCurrencyJSON] = values;
        const fromPriceBtc = fromCurrencyJSON.market_data.current_price.btc;
        const toPriceBtc = toCurrencyJSON.market_data.current_price.btc;
        const conversionRate = fromPriceBtc / toPriceBtc;
        const total =
          document.getElementById(`${amount}`).value * conversionRate;

        document.getElementById(`${result}`).value = total;
        document.getElementById(`${result}`).style.color = 'green';
        setTimeout(() => {
          document.getElementById(`${result}`).style.color = 'black';
        }, 500);
      });
    } else {
      // document.getElementById('result').innerHTML = 'Please select a currency';
    }
  }

  _inputTemplate(direction) {
    return `
    <input class="search-box" id="${direction}-currency" placeholder="Search">
    </input>`;
  }

  _liTemplate(id, name, img) {
    return `
    <li href="#" class="list-group-item search-item px-3 py-1">
      <div class="d-flex">
        ${this._coinTemplate(id, name, img)}
      </div>
    </li>`;
  }

  _selectedCoinTemplate(id, name, img) {
    return `
    <div class="d-flex px-2 py-2">
      ${this._coinTemplate(id, name, img)}
    </div>`;
  }

  _coinTemplate(id, name, img) {
    return `
    <div class="col-3 p-0 align-self-center currency-image">
      <img src="${img}" alt="${id}">
    </div>
    <div class="col-9 p-0">
      <span class="text-lg font-weight-bold currency-name">${name}</span>
      <br>
      <span class="text-sm text-muted currency-id">${id}</span>
    </div>`;
  }
}

export default CryptocurrencyConverter;
