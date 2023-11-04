// Define DOM elements
const priceResult = document.getElementById("priceResult");
const link = document.getElementById("viewChartLink");

/* 
  HANDLERS FOR PRICE CHECK
*/
const cryptoInput = document.getElementById("cryptoInput");
cryptoInput.addEventListener("keydown", handleUserActionOnEnter);

const cryptoDayInput = document.getElementById('cryptoDayInput');
cryptoDayInput.addEventListener("keydown", handleUserActionOnEnter);

const checkPriceBtn = document.getElementById("checkPriceBtn");
checkPriceBtn.addEventListener("click", handleUserAction);

let isLoading = false;

async function handleUserActionOnEnter(event) {
  if (event.key === "Enter") {
    handleUserAction();
  }
}
async function handleUserAction() {
  if (!isLoading) {
    isLoading = true;
    numOfDays = cryptoDayInput.value.trim();
    const cryptoSymbol = cryptoInput.value.trim().toLowerCase().replace(" ", '-');
    const historicalData = await fetchHistoricalPriceData(cryptoSymbol, numOfDays);
    drawPriceChart(cryptoSymbol, historicalData, numOfDays);
    fetchCryptoPrice(cryptoSymbol, priceResult);
  }
}



async function fetchCryptoPrice(cryptoSymbol, cryptoElement) {
  const encodedCryptoSymbol = encodeURIComponent(cryptoSymbol);
  const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${encodedCryptoSymbol}&vs_currencies=usd`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.log('ERROR IN RESPONSE, CHECK FETCHING PARAMS.');
      throw new Error("Network response was not ok");
      cryptoInput.value = '';
    }

    const data = await response.json();

    if (!data || !data[encodedCryptoSymbol] || typeof data[encodedCryptoSymbol].usd !== 'number') {
      console.log('ERROR IN TYPE OF DATA RECIEVED. CHECK JSON RESPONSE DATA.');
      throw new Error("Invalid data received from the API. check json object");
      cryptoInput.value = '';
    }
    const price = data[encodedCryptoSymbol].usd;
    cryptoElement.textContent = `${cryptoSymbol} : ${price}`;
    cryptoInput.value = '';
    cryptoDayInput.value = '';
  } catch (error) {
    console.error("Error fetching crypto price:", error);
    cryptoElement.textContent = "Could Not Find Token";
  } finally {
    isLoading = false;
  }
}

// Function to fetch historical cryptocurrency price data from Coingecko API
async function fetchHistoricalPriceData(cryptoSymbol, numDays) {
  const apiUrl = `https://api.coingecko.com/api/v3/coins/${cryptoSymbol}/market_chart?vs_currency=usd&days=${numDays}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.prices;
  } catch (error) {
    console.error(error);
    return [];
  }
}


function drawPriceChart(cryptoSymbol, historicalData, numberOfDays) {
  // Create a data table with Google Charts format
  const dataTable = new google.visualization.DataTable();
  dataTable.addColumn("date", "Date");
  dataTable.addColumn("number", `${cryptoSymbol.toUpperCase()} Price`);

  if (!historicalData || historicalData.length === 0) {
    // Handle the case where historicalData is not available or is empty
    const options = {
      title: `No Data Available for ${cryptoSymbol.toUpperCase()}`,
      hAxis: {
        title: "Date",
      },
      vAxis: {
        title: "Price (USD)",
        format: "currency",
      },
      legend: { position: "top" },
      backgroundColor: "rgb(113, 115, 133)",
      colors: ["white", "green", "blue"], // COLORS PROPERTY NOT ACTIVE, OVERRIDING STYLES
    };

    // Instantiate and draw an empty chart with the options
    const chart = new google.visualization.LineChart(document.getElementById("priceChart"));
    chart.draw(dataTable, options);

    viewChartLink.style.display = "none"; // Hide the chart link since there's no data
    return; // Exit the function
  }

  // Format historicalData into the data table
  const chartData = historicalData.map((data) => [new Date(data[0]), data[1]]);
  dataTable.addRows(chartData);

  // Calculate the percentage change for the week
  const startPrice = historicalData[0][1];
  const endPrice = historicalData[historicalData.length - 1][1];
  const percentageChange = ((endPrice - startPrice) / startPrice) * 100;
  const formattedPercentageChange = percentageChange >= 0 ? `+${percentageChange.toFixed(2)}` : percentageChange.toFixed(2);



  const options = {
    title: `${numberOfDays} Day Chart (${cryptoSymbol.toUpperCase()}) - Percentage Change: ${formattedPercentageChange}%`,
    hAxis: {
      title: "Date",
    },
    vAxis: {
      title: "Price (USD)",
      format: "currency",
    },
    legend: { position: "top" },
    backgroundColor: "rgb(113, 115, 133)",
    colors: ["white", "green", "blue"]
  };

  // Instantiate and draw the chart
  const chart = new google.visualization.LineChart(document.getElementById("priceChart"));
  chart.draw(dataTable, options);

  viewChartLink.style.display = "block";
}


// Load Google Charts library
google.charts.load("current", { packages: ["corechart"] });
/* 
      CODE TO STORE INPUT VALUE
*/
window.addEventListener('beforeunload', () => {
  const cryptoSymbol = cryptoInput.value.trim();
  const numOfDays = cryptoDayInput.value.trim();
  const dataArray = new Array(cryptoSymbol, numOfDays);
  localStorage.setItem('dataArray', JSON.stringify(dataArray));
});
// Retrieve crypto symbol from local storage on page load
document.addEventListener('DOMContentLoaded', () => {
  // Retrieve the stored crypto symbol from local storage
  const storedDataArray = JSON.parse(localStorage.getItem('dataArray')) || [];
  cryptoInput.value = storedDataArray[0] || '';
  cryptoDayInput.value = storedDataArray[1] || '';
});
