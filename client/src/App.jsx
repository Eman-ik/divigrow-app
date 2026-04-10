import { useState, useEffect } from "react";
import { SECTORS, SECTOR_COLORS } from "./data/mockData";
import {
	getMockPrice,
	getMockYield,
	mapHoldingFromApi,
	mapHoldingToApi,
} from "./utils/stockUtils";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const AUTH_STORAGE_KEY = "divigrow_auth_token";
const DEMO_USERNAME = "divi";
const DEMO_PASSWORD = "divi123";

export default function DiviGrow() {
	const [authToken, setAuthToken] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) || "");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loginError, setLoginError] = useState("");
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [tab, setTab] = useState("portfolio");
	const [holdings, setHoldings] = useState([]);
	const [stockData, setStockData] = useState({});
	const [monthlyGoal, setMonthlyGoal] = useState(1500);
	const [editingGoal, setEditingGoal] = useState(false);
	const [goalInput, setGoalInput] = useState("1500");
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [form, setForm] = useState({
		ticker: "",
		shares: "",
		avgPrice: "",
		sector: "Technology",
	});
	const [formError, setFormError] = useState("");
	const [whatIfTicker, setWhatIfTicker] = useState("KO");
	const [whatIfAmount, setWhatIfAmount] = useState(5000);
	const [whatIfResult, setWhatIfResult] = useState(null);
	const [deleteConfirm, setDeleteConfirm] = useState(null);
	const [apiError, setApiError] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const isAuthenticated = Boolean(authToken);

	function getAuthHeaders(includeJson = false) {
		const headers = {};
		if (includeJson) {
			headers["Content-Type"] = "application/json";
		}
		if (authToken) {
			headers.Authorization = `Bearer ${authToken}`;
		}
		return headers;
	}

	function logout() {
		localStorage.removeItem(AUTH_STORAGE_KEY);
		setAuthToken("");
		setTab("portfolio");
		setHoldings([]);
		setStockData({});
		setApiError("");
		setIsLoading(false);
	}

	async function handleLogin(event) {
		event.preventDefault();
		setLoginError("");
		setIsLoggingIn(true);

		try {
			const response = await fetch(`${API_BASE}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: username.trim(),
					password,
				}),
			});

			if (!response.ok) {
				throw new Error("Invalid credentials. Use the demo username/password below.");
			}

			const data = await response.json();
			if (!data?.token) {
				throw new Error("Login failed. Token was not returned.");
			}

			localStorage.setItem(AUTH_STORAGE_KEY, data.token);
			setAuthToken(data.token);
			setUsername("");
			setPassword("");
			setIsLoading(true);
		} catch (error) {
			setLoginError(error.message || "Unable to login right now.");
		} finally {
			setIsLoggingIn(false);
		}
	}

	async function fetchHoldings() {
		if (!isAuthenticated) {
			setIsLoading(false);
			return;
		}

		setApiError("");
		try {
			const response = await fetch(`${API_BASE}/holdings`, {
				headers: getAuthHeaders(),
			});

			if (response.status === 401) {
				logout();
				throw new Error("Session expired. Please login again.");
			}

			if (!response.ok) {
				throw new Error("Failed to load holdings");
			}
			const data = await response.json();
			setHoldings(data.map(mapHoldingFromApi));
		} catch (error) {
			setApiError(error.message || "Backend is unavailable. Check server and database.");
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		if (isAuthenticated) {
			setIsLoading(true);
			fetchHoldings();
			return;
		}

		setIsLoading(false);
	}, [isAuthenticated]);

	useEffect(() => {
		const toLoad = holdings.filter((h) => !stockData[h.ticker]).map((h) => h.ticker);
		if (!toLoad.length) return;
		const updates = {};
		toLoad.forEach((ticker) => {
			updates[ticker] = {
				price: getMockPrice(ticker),
				divYield: getMockYield(ticker),
				name: ticker,
			};
		});
		setStockData((prev) => ({ ...prev, ...updates }));
	}, [holdings, stockData]);

	const totalValue = holdings.reduce(
		(s, h) => s + (stockData[h.ticker]?.price || h.avgPrice) * h.shares,
		0,
	);

	const annualIncome = holdings.reduce((s, h) => {
		const price = stockData[h.ticker]?.price || h.avgPrice;
		const yld = (stockData[h.ticker]?.divYield || 0) / 100;
		return s + price * h.shares * yld;
	}, 0);

	const monthlyIncome = annualIncome / 12;
	const progressPct = monthlyGoal > 0 ? Math.min((monthlyIncome / monthlyGoal) * 100, 100) : 0;

	function openAdd() {
		setEditingId(null);
		setForm({ ticker: "", shares: "", avgPrice: "", sector: "Technology" });
		setFormError("");
		setShowForm(true);
	}

	function openEdit(h) {
		setEditingId(h.id);
		setForm({
			ticker: h.ticker,
			shares: String(h.shares),
			avgPrice: String(h.avgPrice),
			sector: h.sector,
		});
		setFormError("");
		setShowForm(true);
	}

	async function handleFormSubmit() {
		const ticker = form.ticker.trim().toUpperCase();
		if (!ticker || !form.shares || !form.avgPrice) {
			setFormError("All fields required.");
			return;
		}
		if (Number.isNaN(Number(form.shares)) || Number(form.shares) <= 0) {
			setFormError("Shares must be a positive number.");
			return;
		}
		if (Number.isNaN(Number(form.avgPrice)) || Number(form.avgPrice) <= 0) {
			setFormError("Avg price must be a positive number.");
			return;
		}

		const payload = mapHoldingToApi({
			ticker,
			shares: form.shares,
			avgPrice: form.avgPrice,
			sector: form.sector,
		});

		setFormError("");
		try {
			if (editingId) {
				const response = await fetch(`${API_BASE}/holdings/${editingId}`, {
					method: "PUT",
					headers: getAuthHeaders(true),
					body: JSON.stringify(payload),
				});
				if (response.status === 401) {
					logout();
					throw new Error("Session expired. Please login again.");
				}
				if (!response.ok) throw new Error("Failed to update holding.");
			} else {
				const response = await fetch(`${API_BASE}/holdings`, {
					method: "POST",
					headers: getAuthHeaders(true),
					body: JSON.stringify(payload),
				});
				if (response.status === 401) {
					logout();
					throw new Error("Session expired. Please login again.");
				}
				if (!response.ok) throw new Error("Failed to add holding.");
			}

			await fetchHoldings();
			setShowForm(false);
			setEditingId(null);
		} catch (error) {
			setFormError(error.message || "Unable to save holding.");
		}
	}

	async function deleteHolding(id) {
		try {
			const response = await fetch(`${API_BASE}/holdings/${id}`, {
				method: "DELETE",
				headers: getAuthHeaders(),
			});
			if (response.status === 401) {
				logout();
				throw new Error("Session expired. Please login again.");
			}
			if (!response.ok) throw new Error("Failed to delete holding.");
			setHoldings((prev) => prev.filter((x) => x.id !== id));
			setDeleteConfirm(null);
		} catch (error) {
			setApiError(error.message || "Unable to delete holding.");
			setDeleteConfirm(null);
		}
	}

	function calcWhatIf() {
		const ticker = whatIfTicker.trim().toUpperCase();
		const price = getMockPrice(ticker);
		const divYield = getMockYield(ticker) / 100;
		const shares = Math.floor(whatIfAmount / price);
		const ann = shares * price * divYield;
		setWhatIfResult({
			ticker,
			price,
			shares,
			divYield: divYield * 100,
			annualIncome: ann,
			monthlyIncome: ann / 12,
		});
	}

	const sectorBreakdown = holdings.reduce((acc, h) => {
		const val = (stockData[h.ticker]?.price || h.avgPrice) * h.shares;
		acc[h.sector] = (acc[h.sector] || 0) + val;
		return acc;
	}, {});

	const barColor = progressPct >= 100 ? "#1D9E75" : progressPct >= 50 ? "#BA7517" : "#378ADD";

	if (!isAuthenticated) {
		return (
			<div
				style={{
					fontFamily: "'Georgia', serif",
					minHeight: "100vh",
					background: "var(--color-background-tertiary)",
					color: "var(--color-text-primary)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "1.5rem",
				}}
			>
				<div
					style={{
						width: "100%",
						maxWidth: 460,
						background: "var(--color-background-primary)",
						border: "0.5px solid var(--color-border-tertiary)",
						borderRadius: "var(--border-radius-lg)",
						padding: "1.5rem",
					}}
				>
					<h1 style={{ margin: "0 0 6px", fontSize: 28 }}>DiviGrow Login</h1>
					<p style={{ margin: "0 0 1rem", color: "var(--color-text-secondary)", fontSize: 13 }}>
						Use the demo credentials to continue.
					</p>

					<div
						style={{
							background: "var(--color-background-secondary)",
							border: "0.5px solid var(--color-border-secondary)",
							borderRadius: "var(--border-radius-md)",
							padding: "10px 12px",
							fontSize: 13,
							marginBottom: "1rem",
						}}
					>
						<div>
							<strong>Username:</strong> {DEMO_USERNAME}
						</div>
						<div>
							<strong>Password:</strong> {DEMO_PASSWORD}
						</div>
					</div>

					<form onSubmit={handleLogin}>
						<label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
							Username
						</label>
						<input
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="divi"
							style={{
								width: "100%",
								boxSizing: "border-box",
								padding: "10px 12px",
								border: "0.5px solid var(--color-border-secondary)",
								borderRadius: "var(--border-radius-md)",
								fontSize: 14,
								marginBottom: 12,
							}}
						/>

						<label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
							Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="divi123"
							style={{
								width: "100%",
								boxSizing: "border-box",
								padding: "10px 12px",
								border: "0.5px solid var(--color-border-secondary)",
								borderRadius: "var(--border-radius-md)",
								fontSize: 14,
								marginBottom: 12,
							}}
						/>

						{loginError && (
							<p style={{ margin: "0 0 10px", color: "#a1362b", fontSize: 13 }}>{loginError}</p>
						)}

						<button
							type="submit"
							disabled={isLoggingIn}
							style={{
								width: "100%",
								background: "#1D9E75",
								color: "#fff",
								border: "none",
								borderRadius: "var(--border-radius-md)",
								padding: "10px 12px",
								fontSize: 14,
								cursor: "pointer",
								fontFamily: "inherit",
								opacity: isLoggingIn ? 0.8 : 1,
							}}
						>
							{isLoggingIn ? "Logging in..." : "Login"}
						</button>
					</form>
				</div>
			</div>
		);
	}

	return (
		<div
			style={{
				fontFamily: "'Georgia', serif",
				minHeight: "100vh",
				background: "var(--color-background-tertiary)",
				color: "var(--color-text-primary)",
			}}
		>
			<header
				style={{
					background: "var(--color-background-primary)",
					borderBottom: "0.5px solid var(--color-border-tertiary)",
					padding: "0 2rem",
				}}
			>
				<div
					style={{
						maxWidth: 1100,
						margin: "0 auto",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						height: 60,
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
						<div
							style={{
								width: 30,
								height: 30,
								borderRadius: "50%",
								background: "#1D9E75",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: 700,
								color: "#fff",
								fontSize: 15,
							}}
						>
							$
						</div>
						<span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>DiviGrow</span>
						<span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>dividend tracker</span>
					</div>
					<div style={{ display: "flex", gap: 4 }}>
						{["portfolio", "dashboard", "calculator"].map((key) => (
							<button
								key={key}
								onClick={() => setTab(key)}
								style={{
									padding: "6px 16px",
									borderRadius: "var(--border-radius-md)",
									border: "0.5px solid",
									cursor: "pointer",
									fontFamily: "inherit",
									fontSize: 13,
									fontWeight: tab === key ? 500 : 400,
									borderColor: tab === key ? "#1D9E75" : "var(--color-border-tertiary)",
									background: tab === key ? "#1D9E75" : "transparent",
									color: tab === key ? "#fff" : "var(--color-text-secondary)",
								}}
							>
								{key === "portfolio" ? "Portfolio" : key === "dashboard" ? "Dashboard" : "What If"}
							</button>
						))}
						<button
							onClick={logout}
							style={{
								padding: "6px 16px",
								borderRadius: "var(--border-radius-md)",
								border: "0.5px solid #E24B4A88",
								cursor: "pointer",
								fontFamily: "inherit",
								fontSize: 13,
								background: "transparent",
								color: "#E24B4A",
							}}
						>
							Logout
						</button>
					</div>
				</div>
			</header>

			<main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
				{apiError && (
					<div
						style={{
							marginBottom: "1rem",
							background: "#fff0ef",
							border: "0.5px solid #efb7b2",
							color: "#a1362b",
							borderRadius: "var(--border-radius-md)",
							padding: "10px 12px",
							fontSize: 13,
						}}
					>
						{apiError}
					</div>
				)}

				{tab === "portfolio" && (
					<div>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "1.5rem",
							}}
						>
							<div>
								<h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>My Portfolio</h2>
								<p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>
									{holdings.length} holdings tracked
								</p>
							</div>
							<button
								onClick={openAdd}
								style={{
									background: "#1D9E75",
									color: "#fff",
									border: "none",
									borderRadius: "var(--border-radius-md)",
									padding: "8px 18px",
									fontSize: 14,
									cursor: "pointer",
									fontFamily: "inherit",
									fontWeight: 500,
								}}
							>
								+ Add Stock
							</button>
						</div>

						{showForm && (
							<div
								style={{
									background: "var(--color-background-primary)",
									border: "0.5px solid var(--color-border-secondary)",
									borderRadius: "var(--border-radius-lg)",
									padding: "1.5rem",
									marginBottom: "1.5rem",
								}}
							>
								<h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 500 }}>
									{editingId ? "Edit Holding" : "Add New Holding"}
								</h3>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 1fr 1fr 1fr",
										gap: 12,
										marginBottom: 12,
									}}
								>
									{[
										{ label: "Ticker", key: "ticker", ph: "AAPL" },
										{ label: "Shares", key: "shares", ph: "100" },
										{ label: "Avg. Price ($)", key: "avgPrice", ph: "150.00" },
									].map(({ label, key, ph }) => (
										<div key={key}>
											<label
												style={{
													fontSize: 12,
													color: "var(--color-text-secondary)",
													display: "block",
													marginBottom: 4,
												}}
											>
												{label}
											</label>
											<input
												value={form[key]}
												onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
												placeholder={ph}
												style={{
													width: "100%",
													boxSizing: "border-box",
													padding: "8px 10px",
													border: "0.5px solid var(--color-border-secondary)",
													borderRadius: "var(--border-radius-md)",
													background: "var(--color-background-secondary)",
													color: "var(--color-text-primary)",
													fontSize: 14,
												}}
											/>
										</div>
									))}
									<div>
										<label
											style={{
												fontSize: 12,
												color: "var(--color-text-secondary)",
												display: "block",
												marginBottom: 4,
											}}
										>
											Sector
										</label>
										<select
											value={form.sector}
											onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
											style={{
												width: "100%",
												boxSizing: "border-box",
												padding: "8px 10px",
												border: "0.5px solid var(--color-border-secondary)",
												borderRadius: "var(--border-radius-md)",
												background: "var(--color-background-secondary)",
												color: "var(--color-text-primary)",
												fontSize: 14,
											}}
										>
											{SECTORS.map((s) => (
												<option key={s}>{s}</option>
											))}
										</select>
									</div>
								</div>
								{formError && <p style={{ color: "#E24B4A", fontSize: 13, margin: "0 0 10px" }}>{formError}</p>}
								<div style={{ display: "flex", gap: 8 }}>
									<button
										onClick={handleFormSubmit}
										style={{
											background: "#1D9E75",
											color: "#fff",
											border: "none",
											borderRadius: "var(--border-radius-md)",
											padding: "8px 18px",
											fontSize: 14,
											cursor: "pointer",
											fontFamily: "inherit",
											fontWeight: 500,
										}}
									>
										{editingId ? "Save Changes" : "Add Holding"}
									</button>
									<button
										onClick={() => setShowForm(false)}
										style={{
											background: "transparent",
											border: "0.5px solid var(--color-border-secondary)",
											borderRadius: "var(--border-radius-md)",
											padding: "8px 14px",
											fontSize: 14,
											cursor: "pointer",
											fontFamily: "inherit",
											color: "var(--color-text-secondary)",
										}}
									>
										Cancel
									</button>
								</div>
							</div>
						)}

						<div
							style={{
								background: "var(--color-background-primary)",
								border: "0.5px solid var(--color-border-tertiary)",
								borderRadius: "var(--border-radius-lg)",
								overflow: "auto",
							}}
						>
							<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
								<thead>
									<tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
										{[
											"Ticker",
											"Sector",
											"Shares",
											"Avg. Price",
											"Current Price",
											"Market Value",
											"Div. Yield",
											"Annual Income",
											"Actions",
										].map((h) => (
											<th
												key={h}
												style={{
													padding: "11px 14px",
													textAlign: "left",
													fontSize: 11,
													color: "var(--color-text-secondary)",
													fontWeight: 500,
													whiteSpace: "nowrap",
												}}
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{isLoading && (
										<tr>
											<td colSpan={9} style={{ padding: "2rem", textAlign: "center" }}>
												Loading holdings...
											</td>
										</tr>
									)}
									{!isLoading &&
										holdings.map((h, i) => {
											const sd = stockData[h.ticker];
											const price = sd?.price || h.avgPrice;
											const yld = sd?.divYield || 0;
											const value = price * h.shares;
											const income = (value * yld) / 100;
											const gain = ((price - h.avgPrice) / h.avgPrice) * 100;
											return (
												<tr
													key={h.id}
													style={{
														borderBottom:
															i < holdings.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
													}}
												>
													<td style={{ padding: "13px 14px" }}>
														<span
															style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 14, color: "#1D9E75" }}
														>
															{h.ticker}
														</span>
													</td>
													<td style={{ padding: "13px 14px" }}>
														<span
															style={{
																fontSize: 11,
																padding: "3px 8px",
																borderRadius: 999,
																background: `${SECTOR_COLORS[h.sector] || "#888"}22`,
																color: SECTOR_COLORS[h.sector] || "#888",
																fontWeight: 500,
															}}
														>
															{h.sector}
														</span>
													</td>
													<td style={{ padding: "13px 14px" }}>{h.shares.toLocaleString()}</td>
													<td style={{ padding: "13px 14px", color: "var(--color-text-secondary)" }}>
														${h.avgPrice.toFixed(2)}
													</td>
													<td style={{ padding: "13px 14px" }}>
														${price.toFixed(2)}{" "}
														<span style={{ fontSize: 11, color: gain >= 0 ? "#1D9E75" : "#E24B4A" }}>
															({gain >= 0 ? "+" : ""}
															{gain.toFixed(1)}%)
														</span>
													</td>
													<td style={{ padding: "13px 14px", fontWeight: 500 }}>
														${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
													</td>
													<td style={{ padding: "13px 14px", color: "#1D9E75" }}>{yld.toFixed(2)}%</td>
													<td style={{ padding: "13px 14px", fontWeight: 500 }}>${income.toFixed(0)}/yr</td>
													<td style={{ padding: "13px 14px" }}>
														<div style={{ display: "flex", gap: 6 }}>
															<button
																onClick={() => openEdit(h)}
																style={{
																	fontSize: 11,
																	padding: "4px 10px",
																	border: "0.5px solid var(--color-border-secondary)",
																	borderRadius: "var(--border-radius-md)",
																	background: "transparent",
																	color: "var(--color-text-secondary)",
																	cursor: "pointer",
																	fontFamily: "inherit",
																}}
															>
																Edit
															</button>
															{deleteConfirm === h.id ? (
																<span style={{ display: "flex", gap: 4 }}>
																	<button
																		onClick={() => deleteHolding(h.id)}
																		style={{
																			fontSize: 11,
																			padding: "4px 10px",
																			border: "none",
																			borderRadius: "var(--border-radius-md)",
																			background: "#E24B4A",
																			color: "#fff",
																			cursor: "pointer",
																			fontFamily: "inherit",
																		}}
																	>
																		Confirm
																	</button>
																	<button
																		onClick={() => setDeleteConfirm(null)}
																		style={{
																			fontSize: 11,
																			padding: "4px 8px",
																			border: "0.5px solid var(--color-border-secondary)",
																			borderRadius: "var(--border-radius-md)",
																			background: "transparent",
																			cursor: "pointer",
																			fontFamily: "inherit",
																		}}
																	>
																		x
																	</button>
																</span>
															) : (
																<button
																	onClick={() => setDeleteConfirm(h.id)}
																	style={{
																		fontSize: 11,
																		padding: "4px 10px",
																		border: "0.5px solid #E24B4A55",
																		borderRadius: "var(--border-radius-md)",
																		background: "transparent",
																		color: "#E24B4A",
																		cursor: "pointer",
																		fontFamily: "inherit",
																	}}
																>
																	Delete
																</button>
															)}
														</div>
													</td>
												</tr>
											);
										})}
									{!isLoading && holdings.length === 0 && (
										<tr>
											<td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-tertiary)" }}>
												No holdings yet. Add your first stock above.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>

						<div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: "1.5rem" }}>
							{[
								{
									label: "Portfolio Value",
									value: `$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
								},
								{
									label: "Annual Dividend",
									value: `$${annualIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
								},
								{ label: "Monthly Income", value: `$${monthlyIncome.toFixed(0)}/mo` },
								{
									label: "Avg. Yield",
									value: totalValue > 0 ? `${((annualIncome / totalValue) * 100).toFixed(2)}%` : "-",
								},
							].map((card) => (
								<div
									key={card.label}
									style={{
										background: "var(--color-background-primary)",
										border: "0.5px solid var(--color-border-tertiary)",
										borderRadius: "var(--border-radius-md)",
										padding: "1rem",
									}}
								>
									<p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--color-text-secondary)" }}>
										{card.label}
									</p>
									<p style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{card.value}</p>
								</div>
							))}
						</div>
					</div>
				)}

				{tab === "dashboard" && (
					<div>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "1.5rem",
							}}
						>
							<div>
								<h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Income Dashboard</h2>
								<p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>
									Progress toward your dividend salary
								</p>
							</div>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Monthly Goal:</span>
								{editingGoal ? (
									<span style={{ display: "flex", gap: 6 }}>
										<input
											value={goalInput}
											onChange={(e) => setGoalInput(e.target.value)}
											style={{
												width: 90,
												padding: "5px 8px",
												border: "0.5px solid var(--color-border-secondary)",
												borderRadius: "var(--border-radius-md)",
												fontSize: 14,
												background: "var(--color-background-secondary)",
												color: "var(--color-text-primary)",
											}}
										/>
										<button
											onClick={() => {
												setMonthlyGoal(Number(goalInput) || 1500);
												setEditingGoal(false);
											}}
											style={{
												background: "#1D9E75",
												color: "#fff",
												border: "none",
												borderRadius: "var(--border-radius-md)",
												padding: "5px 12px",
												cursor: "pointer",
												fontSize: 13,
												fontFamily: "inherit",
											}}
										>
											Save
										</button>
									</span>
								) : (
									<button
										onClick={() => {
											setGoalInput(String(monthlyGoal));
											setEditingGoal(true);
										}}
										style={{
											fontSize: 14,
											fontWeight: 600,
											color: "#1D9E75",
											background: "transparent",
											border: "0.5px solid #1D9E75",
											borderRadius: "var(--border-radius-md)",
											padding: "5px 12px",
											cursor: "pointer",
											fontFamily: "inherit",
										}}
									>
										${monthlyGoal.toLocaleString()}/mo ✎
									</button>
								)}
							</div>
						</div>

						<div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: "1.5rem" }}>
							{[
								{
									label: "Portfolio Value",
									value: `$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
									sub: "total market value",
								},
								{
									label: "Annual Dividends",
									value: `$${annualIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
									sub: "estimated per year",
								},
								{
									label: "Monthly Income",
									value: `$${monthlyIncome.toFixed(0)}`,
									sub: "passive income / month",
								},
								{
									label: "Goal Progress",
									value: `${progressPct.toFixed(1)}%`,
									sub: `of $${monthlyGoal.toLocaleString()} target`,
								},
							].map((card) => (
								<div
									key={card.label}
									style={{
										background: "var(--color-background-secondary)",
										borderRadius: "var(--border-radius-md)",
										padding: "1rem",
										border: "0.5px solid var(--color-border-tertiary)",
									}}
								>
									<p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--color-text-secondary)" }}>
										{card.label}
									</p>
									<p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 500 }}>{card.value}</p>
									<p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)" }}>{card.sub}</p>
								</div>
							))}
						</div>

						<div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
							<div>
								<div
									style={{
										background: "var(--color-background-primary)",
										border: "0.5px solid var(--color-border-tertiary)",
										borderRadius: "var(--border-radius-lg)",
										padding: "1.5rem",
										marginBottom: "1rem",
									}}
								>
									<h3 style={{ margin: "0 0 1.5rem", fontSize: 15, fontWeight: 500 }}>
										Monthly income vs. goal
									</h3>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											fontSize: 13,
											marginBottom: 8,
											color: "var(--color-text-secondary)",
										}}
									>
										<span>${monthlyIncome.toFixed(0)} earned / month</span>
										<span>Goal: ${monthlyGoal.toLocaleString()}/mo</span>
									</div>
									<div
										style={{
											height: 32,
											background: "var(--color-background-secondary)",
											borderRadius: 999,
											overflow: "hidden",
											border: "0.5px solid var(--color-border-tertiary)",
										}}
									>
										<div
											style={{
												height: "100%",
												width: `${progressPct}%`,
												borderRadius: 999,
												background: barColor,
												transition: "width 1s ease",
												display: "flex",
												alignItems: "center",
												justifyContent: "flex-end",
												paddingRight: 10,
											}}
										>
											{progressPct > 12 && (
												<span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>
													{progressPct.toFixed(1)}%
												</span>
											)}
										</div>
									</div>
									<p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
										{progressPct >= 100
											? "You've reached your goal!"
											: `$${(monthlyGoal - monthlyIncome).toFixed(0)} more/month needed`}
									</p>

									<div style={{ marginTop: "2rem" }}>
										<h4 style={{ fontSize: 14, fontWeight: 500, margin: "0 0 1rem" }}>
											Contribution by holding
										</h4>
										{[...holdings]
											.sort((a, b) => {
												const incA =
													((stockData[a.ticker]?.price || a.avgPrice) *
														a.shares *
														(stockData[a.ticker]?.divYield || 0)) /
													100;
												const incB =
													((stockData[b.ticker]?.price || b.avgPrice) *
														b.shares *
														(stockData[b.ticker]?.divYield || 0)) /
													100;
												return incB - incA;
											})
											.map((h) => {
												const price = stockData[h.ticker]?.price || h.avgPrice;
												const yld = (stockData[h.ticker]?.divYield || 0) / 100;
												const monthInc = (price * h.shares * yld) / 12;
												const pct = annualIncome > 0 ? ((monthInc * 12) / annualIncome) * 100 : 0;
												return (
													<div key={h.id} style={{ marginBottom: 12 }}>
														<div
															style={{
																display: "flex",
																justifyContent: "space-between",
																fontSize: 13,
																marginBottom: 5,
															}}
														>
															<span style={{ fontWeight: 500, fontFamily: "monospace" }}>{h.ticker}</span>
															<span style={{ color: "var(--color-text-secondary)" }}>
																${monthInc.toFixed(0)}/mo . {pct.toFixed(1)}%
															</span>
														</div>
														<div
															style={{
																height: 8,
																background: "var(--color-background-secondary)",
																borderRadius: 999,
																overflow: "hidden",
															}}
														>
															<div
																style={{
																	height: "100%",
																	width: `${pct}%`,
																	background: SECTOR_COLORS[h.sector] || "#1D9E75",
																	borderRadius: 999,
																}}
															></div>
														</div>
													</div>
												);
											})}
									</div>
								</div>
							</div>

							<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
								<div
									style={{
										background: "var(--color-background-primary)",
										border: "0.5px solid var(--color-border-tertiary)",
										borderRadius: "var(--border-radius-lg)",
										padding: "1.5rem",
									}}
								>
									<h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 500 }}>Sector allocation</h3>
									{Object.entries(sectorBreakdown)
										.sort((a, b) => b[1] - a[1])
										.map(([sector, val]) => (
											<div
												key={sector}
												style={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													marginBottom: 10,
												}}
											>
												<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
													<div
														style={{
															width: 10,
															height: 10,
															borderRadius: 2,
															background: SECTOR_COLORS[sector] || "#888",
														}}
													></div>
													<span style={{ fontSize: 13 }}>{sector}</span>
												</div>
												<span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
													{((val / totalValue) * 100).toFixed(1)}%
												</span>
											</div>
										))}
									{Object.keys(sectorBreakdown).length === 0 && (
										<p style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>No holdings</p>
									)}
								</div>

								<div
									style={{
										background: "var(--color-background-primary)",
										border: "0.5px solid var(--color-border-tertiary)",
										borderRadius: "var(--border-radius-lg)",
										padding: "1.5rem",
									}}
								>
									<h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>Monthly estimates</h3>
									{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
										(m, i) => {
											const est = monthlyIncome * (0.88 + (i % 3 === 2 ? 0.24 : i % 3 === 0 ? 0 : 0.04));
											return (
												<div
													key={m}
													style={{
														display: "flex",
														justifyContent: "space-between",
														fontSize: 12,
														padding: "4px 0",
														borderBottom: i < 11 ? "0.5px solid var(--color-border-tertiary)" : undefined,
													}}
												>
													<span style={{ color: "var(--color-text-secondary)" }}>{m}</span>
													<span style={{ fontWeight: 500 }}>${est.toFixed(0)}</span>
												</div>
											);
										},
									)}
									<p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>
										Quarterly payout pattern estimated
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{tab === "calculator" && (
					<div>
						<div style={{ marginBottom: "1.5rem" }}>
							<h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>What If Calculator</h2>
							<p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>
								Simulate how a new investment would impact your dividend income
							</p>
						</div>

						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
							<div
								style={{
									background: "var(--color-background-primary)",
									border: "0.5px solid var(--color-border-tertiary)",
									borderRadius: "var(--border-radius-lg)",
									padding: "1.5rem",
								}}
							>
								<h3 style={{ margin: "0 0 1.5rem", fontSize: 15, fontWeight: 500 }}>Investment parameters</h3>

								<div style={{ marginBottom: 20 }}>
									<label
										style={{
											fontSize: 12,
											color: "var(--color-text-secondary)",
											display: "block",
											marginBottom: 6,
										}}
									>
										Stock ticker
									</label>
									<input
										value={whatIfTicker}
										onChange={(e) => setWhatIfTicker(e.target.value.toUpperCase())}
										placeholder="e.g. AAPL, KO, JNJ"
										style={{
											width: "100%",
											boxSizing: "border-box",
											padding: "10px 12px",
											border: "0.5px solid var(--color-border-secondary)",
											borderRadius: "var(--border-radius-md)",
											fontSize: 16,
											fontFamily: "monospace",
											background: "var(--color-background-secondary)",
											color: "var(--color-text-primary)",
										}}
									/>
								</div>

								<div style={{ marginBottom: 20 }}>
									<label
										style={{
											fontSize: 12,
											color: "var(--color-text-secondary)",
											display: "block",
											marginBottom: 6,
										}}
									>
										Amount: <strong style={{ color: "var(--color-text-primary)" }}>${whatIfAmount.toLocaleString()}</strong>
									</label>
									<input
										type="range"
										min={500}
										max={100000}
										step={500}
										value={whatIfAmount}
										onChange={(e) => setWhatIfAmount(Number(e.target.value))}
										style={{ width: "100%" }}
									/>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											fontSize: 11,
											color: "var(--color-text-tertiary)",
											marginTop: 4,
										}}
									>
										<span>$500</span>
										<span>$100,000</span>
									</div>
								</div>

								<div style={{ marginBottom: 20 }}>
									<label
										style={{
											fontSize: 12,
											color: "var(--color-text-secondary)",
											display: "block",
											marginBottom: 6,
										}}
									>
										Quick amounts
									</label>
									<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
										{[1000, 5000, 10000, 25000, 50000].map((amt) => (
											<button
												key={amt}
												onClick={() => setWhatIfAmount(amt)}
												style={{
													padding: "6px 14px",
													border: "0.5px solid",
													borderRadius: "var(--border-radius-md)",
													fontSize: 13,
													cursor: "pointer",
													fontFamily: "inherit",
													borderColor: whatIfAmount === amt ? "#1D9E75" : "var(--color-border-secondary)",
													background: whatIfAmount === amt ? "#1D9E7522" : "transparent",
													color: whatIfAmount === amt ? "#1D9E75" : "var(--color-text-secondary)",
												}}
											>
												${amt / 1000}k
											</button>
										))}
									</div>
								</div>

								<button
									onClick={calcWhatIf}
									style={{
										width: "100%",
										padding: "12px",
										background: "#1D9E75",
										color: "#fff",
										border: "none",
										borderRadius: "var(--border-radius-md)",
										fontSize: 15,
										cursor: "pointer",
										fontFamily: "inherit",
										fontWeight: 500,
									}}
								>
									Calculate Impact
								</button>

								<div
									style={{
										marginTop: "1.5rem",
										padding: "1rem",
										background: "var(--color-background-secondary)",
										borderRadius: "var(--border-radius-md)",
										fontSize: 13,
									}}
								>
									<p style={{ margin: "0 0 8px", fontWeight: 500 }}>Popular dividend stocks</p>
									<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
										{["KO", "JNJ", "T", "ABBV", "O", "MO", "XOM", "PG", "VZ", "MSFT"].map((t) => (
											<button
												key={t}
												onClick={() => setWhatIfTicker(t)}
												style={{
													fontFamily: "monospace",
													fontSize: 12,
													padding: "3px 8px",
													border: "0.5px solid var(--color-border-secondary)",
													borderRadius: 4,
													background: "transparent",
													color: "#1D9E75",
													cursor: "pointer",
												}}
											>
												{t}
											</button>
										))}
									</div>
								</div>
							</div>

							<div>
								{whatIfResult ? (
									<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
										<div
											style={{
												background: "var(--color-background-primary)",
												border: "2px solid #1D9E75",
												borderRadius: "var(--border-radius-lg)",
												padding: "1.5rem",
											}}
										>
											<div
												style={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "flex-start",
													marginBottom: "1.5rem",
												}}
											>
												<div>
													<p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
														Investing ${whatIfAmount.toLocaleString()} in
													</p>
													<h3 style={{ margin: "4px 0 0", fontSize: 28, fontFamily: "monospace", color: "#1D9E75" }}>
														{whatIfResult.ticker}
													</h3>
												</div>
												<div style={{ textAlign: "right" }}>
													<p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
														Dividend yield
													</p>
													<p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1D9E75" }}>
														{whatIfResult.divYield.toFixed(2)}%
													</p>
												</div>
											</div>

											<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
												{[
													{ label: "Shares you'd own", value: `${whatIfResult.shares.toLocaleString()} shares` },
													{ label: "Price per share", value: `$${whatIfResult.price.toFixed(2)}` },
													{ label: "Annual income added", value: `$${whatIfResult.annualIncome.toFixed(0)}` },
													{ label: "Monthly income added", value: `$${whatIfResult.monthlyIncome.toFixed(0)}` },
												].map(({ label, value }) => (
													<div
														key={label}
														style={{
															background: "var(--color-background-secondary)",
															borderRadius: "var(--border-radius-md)",
															padding: "12px",
														}}
													>
														<p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--color-text-secondary)" }}>
															{label}
														</p>
														<p style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{value}</p>
													</div>
												))}
											</div>

											<div
												style={{
													background: "#1D9E7511",
													borderRadius: "var(--border-radius-md)",
													padding: "1rem",
													border: "0.5px solid #1D9E7544",
												}}
											>
												<p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500, color: "#085041" }}>
													Impact on your goal
												</p>
												<p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--color-text-secondary)" }}>
													  Current: <strong style={{ color: "var(--color-text-primary)" }}>${monthlyIncome.toFixed(0)}/mo</strong>{" -> "}
													  New: <strong style={{ color: "#1D9E75" }}>${(monthlyIncome + whatIfResult.monthlyIncome).toFixed(0)}/mo</strong>
												</p>
												<p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
													Progress: <strong style={{ color: "var(--color-text-primary)" }}>
														{Math.min(((monthlyIncome + whatIfResult.monthlyIncome) / monthlyGoal) * 100, 100).toFixed(1)}%
													</strong>{" "}
													of ${monthlyGoal.toLocaleString()} goal
												</p>
											</div>
										</div>

										<div
											style={{
												background: "var(--color-background-primary)",
												border: "0.5px solid var(--color-border-tertiary)",
												borderRadius: "var(--border-radius-lg)",
												padding: "1.5rem",
											}}
										>
											<h4 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 500 }}>
												5-year income projection (5% annual growth)
											</h4>
											{[1, 2, 3, 4, 5].map((yr) => {
												const projected = whatIfResult.monthlyIncome * Math.pow(1.05, yr);
												const pct = Math.min((projected / monthlyGoal) * 100, 100);
												return (
													<div key={yr} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
														<span style={{ fontSize: 12, color: "var(--color-text-secondary)", width: 36 }}>
															Yr {yr}
														</span>
														<div
															style={{
																flex: 1,
																height: 8,
																background: "var(--color-background-secondary)",
																borderRadius: 999,
																overflow: "hidden",
															}}
														>
															<div
																style={{
																	height: "100%",
																	width: `${pct}%`,
																	background: "#1D9E75",
																	borderRadius: 999,
																	opacity: 0.4 + yr * 0.1,
																}}
															></div>
														</div>
														<span style={{ fontSize: 12, fontWeight: 500, width: 60, textAlign: "right" }}>
															${projected.toFixed(0)}/mo
														</span>
													</div>
												);
											})}
										</div>
									</div>
								) : (
									<div
										style={{
											background: "var(--color-background-primary)",
											border: "0.5px solid var(--color-border-tertiary)",
											borderRadius: "var(--border-radius-lg)",
											padding: "3rem",
											textAlign: "center",
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											justifyContent: "center",
											minHeight: 300,
										}}
									>
										<div
											style={{
												width: 56,
												height: 56,
												borderRadius: "50%",
												background: "var(--color-background-secondary)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												marginBottom: "1rem",
												fontSize: 24,
											}}
										>
											chart
										</div>
										<p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Enter a stock and amount</p>
										<p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>
											See how a new investment would boost your dividend income
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
