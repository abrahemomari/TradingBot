import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ErrorResult } from "./ErrorResult";
import { LogResult } from "./LogResult";
import { TransactionResult } from "./TransactionResult";
import { TradeResult } from "./type";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type ScriptResultType = {
  scriptData: undefined | TradeResult;
  loading: boolean;
};

export const ScriptResult = ({ scriptData, loading }: ScriptResultType) => {
  const [resultSelect, setResultSelect] = useState("transaction");

  const getBalanceData = () => {
    if (!scriptData?.transactions) return null;
    
    let balance = scriptData.account.wallet;
    const dataPoints = scriptData.transactions.map((transaction, index) => ({
      x: index,
      y: balance - transaction.price
    })).reverse();
    
    // Add final balance
    dataPoints.push({
      x: dataPoints.length,
      y: balance
    });
    
    return {
      labels: dataPoints.map(point => `Trade ${point.x}`),
      datasets: [
        {
          label: 'Account Balance',
          data: dataPoints.map(point => point.y),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Account Balance History'
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  const renderResult = (resultTitle: string) => {
    switch (resultTitle) {
      case "transaction":
        return <TransactionResult transactionList={scriptData?.transactions} />;
      case "log":
        return <LogResult logList={scriptData?.logs} />;
      case "error":
        return <ErrorResult errorList={scriptData?.errors} />;
    }
  };
  useEffect(() => {
    setResultSelect("transaction");
  }, [scriptData]);
  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        borderRadius: 2,
        borderTop: "solid 1px #DFDFDF",
        paddingX: 2,
        paddingY: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 400,
        maxHeight: 500,
        overflowY: "scroll",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "row", marginY: 1 }}>
        <Typography fontWeight={600} sx={{ marginRight: 4 }}>
          Result
        </Typography>
        <Box
          sx={{
            marginLeft: 2,
            cursor: "pointer",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
          onClick={() => setResultSelect("transaction")}
        >
          <Typography
            marginRight={1}
            fontWeight={resultSelect === "transaction" ? 600 : 400}
          >
            Transaction
          </Typography>
          {scriptData?.transactions && (
            <Box
              sx={{
                backgroundColor: "#1B76D2",
                padding: 1,
                height: 15,
                borderRadius: 15,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography fontWeight={600} color="white" fontSize={12}>
                {scriptData?.transactions.length}
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            marginLeft: 2,
            cursor: "pointer",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
          onClick={() => setResultSelect("log")}
        >
          <Typography
            marginRight={1}
            fontWeight={resultSelect === "log" ? 600 : 400}
          >
            Logs
          </Typography>
          {scriptData?.logs && (
            <Box
              sx={{
                backgroundColor: "#AAAAAA",
                padding: 1,
                height: 15,
                borderRadius: 15,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography fontWeight={600} color="white" fontSize={12}>
                {scriptData?.logs.length}
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            marginLeft: 2,
            cursor: "pointer",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
          onClick={() => setResultSelect("error")}
        >
          <Typography
            marginRight={1}
            fontWeight={resultSelect === "error" ? 600 : 400}
          >
            Errors
          </Typography>
          {scriptData?.errors && (
            <Box
              sx={{
                backgroundColor: "#CF3049",
                padding: 1,
                height: 15,
                borderRadius: 15,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography fontWeight={600} color="white" fontSize={12}>
                {scriptData?.errors.length}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {scriptData ? (
        <>
          <Box sx={{ display: "flex", flexDirection: "column", marginY: 1 }}>
            <Box sx={{ display: "flex", flexDirection: "row", marginY: 1 }}>
              <Typography sx={{ marginRight: 2 }}>
                Wallet Result: ${scriptData.account.wallet.toFixed(2)}
              </Typography>
              <Typography sx={{ marginRight: 2 }}>
                Remaining Coin: {scriptData.account.coin}
              </Typography>
              <Typography>
                Total Value: {scriptData.account.total.toFixed(2)}
              </Typography>
            </Box>
            
            <Box sx={{ height: 200, marginY: 2 }}>
              {getBalanceData() && (
                <Line options={chartOptions} data={getBalanceData()!} />
              )}
            </Box>
          </Box>
          {renderResult(resultSelect)}
        </>
      ) : loading ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography color="#AAAAAA">
            Run the script to see the Result!
          </Typography>
        </Box>
      )}
    </Box>
  );
};
