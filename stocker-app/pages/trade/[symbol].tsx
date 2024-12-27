import { Box, Button, Typography } from "@mui/material";
import React, { FC, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getCoinInfo } from "../../constant/CoinData";
import Chart from "chart.js/auto";
import { Line } from "react-chartjs-2";
import { CategoryScale } from "chart.js";
import AccountInfo from "../../components/Trade/AccountInfo";
import CoinInfo from "../../components/Trade/CoinInfo";
import useAccount from "../../stocker-core/sdk/Account/useAccount";
import { db } from "../../utils/firebase";
import { recoilUserId } from "../../states";
import { useRecoilValue } from "recoil";
import { useQueries, useQuery } from "react-query";
import { getPriceList } from "../../api/binanceAPI";
import BuyCoin from "../../components/Trade/BuyCoin";
import SellCoin from "../../components/Trade/SellCoin";
import { parsePriceList, parseTimeList } from "../../utils";
import { LoadingIndicator } from "../../components/Common/LoadingIndicator";

Chart.register(CategoryScale);

interface IntervalConfig {
	value: string;
	label: string;
}

const INTERVALS: IntervalConfig[] = [
	{ value: "15m", label: "1d" },
	{ value: "1h", label: "5d" },
	{ value: "8h", label: "1m" },
	{ value: "1d", label: "6m" },
	{ value: "3d", label: "1y" },
];

const CHART_OPTIONS = {
	elements: {
		point: { radius: 1.5 },
	},
	plugins: {
		legend: { display: false },
	},
	scales: {
		x: { grid: { display: false, drawTicks: false }, display: false },
		y: { grid: { display: false }, display: false },
	},
} as const;

const TradeSymbol: FC = () => {
	const router = useRouter();
	const symbol = router.query.symbol as string;
	const [price, setPrice] = useState<number>(-1);
	const [interval, setInterval] = useState<string>(INTERVALS[0].value);
	const userId = useRecoilValue(recoilUserId);
	const accountInfo = useAccount(db, userId);
	const [openBuy, setOpenBuy] = useState(false);
	const [openSell, setOpenSell] = useState(false);
	const [indexOfWallet, setIndexOfWallet] = useState(-1);
	const ws = useRef<WebSocket | null>(null);

	// Fetch price data for all intervals
	useQueries(
		INTERVALS.map(({ value }) => ({
			queryKey: ["priceList", symbol, value],
			queryFn: () => getPriceList(symbol, value),
		}))
	);

	const priceListData = useQuery(
		["priceList", symbol, interval],
		() => getPriceList(symbol, interval),
		{ enabled: !!symbol }
	);

	// WebSocket connection for real-time price updates
	useEffect(() => {
		if (!symbol) return;

		if (ws.current?.readyState === WebSocket.OPEN) {
			ws.current.close();
		}

		ws.current = new WebSocket(
			`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`
		);

		ws.current.onmessage = (event) => {
			const stockObject = JSON.parse(event.data);
			setPrice(Number(stockObject.p));
		};

		ws.current.onerror = (error) => {
			console.error("WebSocket error:", error);
		};

		return () => {
			ws.current?.close();
		};
	}, [symbol]);

	// Update wallet index when account info changes
	useEffect(() => {
		if (accountInfo.account) {
			const checkWalletIndex = accountInfo.account.wallets.findIndex(
				(item) => item.symbol === symbol
			);
			setIndexOfWallet(checkWalletIndex);
		}
	}, [accountInfo.account, symbol]);

	if (priceListData.isLoading || accountInfo.loading || price < 0) {
		return <LoadingIndicator />;
	}

	const chartData = {
		labels: parseTimeList(priceListData.data).concat("now"),
		datasets: [{
			data: parsePriceList(priceListData.data).concat(price),
		}],
	};

	const priceDifference = price - priceListData.data[0].closePrice;
	const pricePercentage = ((priceDifference / price) * 100).toFixed(2);
	const isPriceUp = priceDifference >= 0;
	const priceColor = isPriceUp ? "#04A56D" : "#CF3049";

	return (
		<Box>
			<Box sx={{ marginTop: 3 }}>
				<Typography variant="h4" fontWeight={800}>
					{getCoinInfo(symbol)?.name}
				</Typography>
				<Box sx={{ display: "flex", alignItems: "center" }}>
					<Typography variant="h6" fontWeight={600} sx={{ marginRight: 1 }}>
						{price.toFixed(2)}
					</Typography>
					<Typography variant="h6" fontWeight={400} color={priceColor}>
						{isPriceUp ? "+" : ""}
						{priceDifference.toFixed(2)} ({pricePercentage}%)
					</Typography>
				</Box>
			</Box>

			<Box sx={{ maxHeight: { xs: 300, sm: 600 } }}>
				<Line data={chartData} options={CHART_OPTIONS} />
				<Box sx={{ display: "flex", justifyContent: "center", marginY: 2 }}>
					<Box sx={{
						display: "flex",
						justifyContent: "space-around",
						alignItems: "center",
						width: 300,
					}}>
						{INTERVALS.map(({ value, label }) => (
							<Button
								key={value}
								variant={interval === value ? "contained" : "outlined"}
								size="small"
								sx={{ padding: 0, minWidth: 40 }}
								onClick={() => setInterval(value)}
							>
								{label}
							</Button>
						))}
					</Box>
				</Box>
			</Box>

			<Box sx={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				justifyContent: "center",
				alignItems: "center",
				border: "solid 1px #DFDFDF",
				padding: 2,
				borderRadius: 2,
			}}>
				<AccountInfo accountInfo={accountInfo.account} />
				<CoinInfo
					symbol={symbol}
					wallet={accountInfo.account?.wallets[indexOfWallet]}
					currentPrice={price}
				/>
				<Box maxWidth={300} sx={{ marginY: 2 }}>
					<Button
						variant="outlined"
						size="large"
						sx={{ width: 130, marginRight: 1 }}
						onClick={() => setOpenBuy(true)}
					>
						Buy
					</Button>
					<Button
						variant="outlined"
						size="large"
						sx={{ width: 130 }}
						color="error"
						onClick={() => setOpenSell(true)}
					>
						Sell
					</Button>
				</Box>
			</Box>

			<BuyCoin
				price={price}
				open={openBuy}
				setOpen={setOpenBuy}
				title={symbol}
				pricePercentage={String(pricePercentage)}
				priceDifference={priceDifference}
				availableSaving={accountInfo.account?.wallets[0].amount ?? 0}
			/>
			<SellCoin
				price={price}
				open={openSell}
				setOpen={setOpenSell}
				title={symbol}
				pricePercentage={String(pricePercentage)}
				priceDifference={priceDifference}
				availableCoin={accountInfo.account?.wallets[indexOfWallet]?.amount ?? 0}
			/>
		</Box>
	);
};

export default TradeSymbol;
