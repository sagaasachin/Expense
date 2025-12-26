import React, { useState, useMemo, useEffect } from "react";
import {
  Container,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CssBaseline,
  Grid,
} from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Correct backend API base
const API_BASE = "https://expense-backend-z8da.onrender.com/api";

const MoneyManager = () => {
  // Transaction form state
  const [entries, setEntries] = useState([]);
  const [person, setPerson] = useState("");
  const [type, setType] = useState("deposit");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Filters
  const [filterPerson, setFilterPerson] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");

  const today = new Date();

  // ====== API CALLS ======

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const addTransaction = async (transaction) => {
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      const data = await res.json();
      if (!data.success) throw new Error("Failed to add transaction");
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to add transaction. Please try again.");
    }
  };

  // Load transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!person.trim() || !amount || !date) return;

    const transaction = {
      person: person.trim().toUpperCase(),
      type,
      category: type === "expense" ? category.trim() || "N/A" : "N/A",
      amount: parseFloat(amount),
      date,
    };

    await addTransaction(transaction);

    setPerson("");
    setType("deposit");
    setCategory("");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
  };

  // Unique persons
  const uniquePersons = useMemo(() => {
    const persons = entries.map((e) => e.person);
    return Array.from(new Set(persons)).sort();
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterPerson !== "all" && e.person !== filterPerson) return false;
      if (filterMonth) {
        const entryMonth = e.date.slice(0, 7);
        if (entryMonth !== filterMonth) return false;
      }
      return true;
    });
  }, [entries, filterPerson, filterMonth]);

  // ===== Chart Data (Monthly Deposits vs Expenses) =====
  const chartData = useMemo(() => {
    const map = {};
    filteredEntries.forEach((e) => {
      const m = e.date.slice(0, 7);
      if (!map[m]) map[m] = { month: m, deposit: 0, expense: 0 };
      if (e.type === "deposit") map[m].deposit += e.amount;
      else map[m].expense += e.amount;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredEntries]);

  // Group and calculate running balances (original logic kept)
  const groupedData = useMemo(() => {
    const grouped = {};
    const persons = filterPerson === "all" ? uniquePersons : [filterPerson];

    persons.forEach((p) => {
      const personEntries = filteredEntries
        .filter((e) => e.person === p)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const monthsMap = {};
      let prevMonthEndingBalance = 0;

      personEntries.forEach((entry) => {
        const monthKey = entry.date.slice(0, 7);
        if (!monthsMap[monthKey]) monthsMap[monthKey] = [];
        monthsMap[monthKey].push(entry);
      });

      const monthsSorted = Object.keys(monthsMap).sort();

      grouped[p] = monthsSorted.map((month) => {
        let runningBalance = prevMonthEndingBalance;
        let totalDeposits = 0;
        let totalExpenses = 0;

        const entriesWithBalance = monthsMap[month].map((entry) => {
          if (entry.type === "deposit") {
            runningBalance += entry.amount;
            totalDeposits += entry.amount;
          } else {
            runningBalance -= entry.amount;
            totalExpenses += entry.amount;
          }
          return { ...entry, runningBalance };
        });

        const monthStartingBalance = prevMonthEndingBalance;
        const monthEndingBalance = runningBalance;

        prevMonthEndingBalance = monthEndingBalance;

        return {
          month,
          monthStartingBalance,
          totalDeposits,
          totalExpenses,
          monthEndingBalance,
          entries: entriesWithBalance,
        };
      });
    });

    return grouped;
  }, [filteredEntries, uniquePersons, filterPerson]);

  const formatMonth = (month) => {
    const [year, mon] = month.split("-");
    const date = new Date(year, mon - 1);
    return date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  // Export to Excel (unchanged)
  const exportToExcel = () => {
    if (entries.length === 0) {
      alert("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();

    for (const personName in groupedData) {
      groupedData[personName].forEach(({ month, entries }) => {
        const wsData = [
          ["Date", "Type", "Category", "Amount", "Running Balance"],
          ...entries.map((e) => [
            e.date,
            e.type,
            e.category,
            e.amount,
            e.runningBalance,
          ]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, `${personName}_${month}`);
      });
    }

    const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "transactions.xlsx"
    );
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          bgcolor: "#f0f4f8",
          p: { xs: 1, sm: 3 },
        }}
      >
        <Typography
          variant="h3"
          sx={{
            mb: 3,
            color: "#1976d2",
            textAlign: "center",
            fontSize: { xs: "1.8rem", sm: "2.5rem" },
          }}
        >
          Expense Tracker
        </Typography>

        {/* === FORM === */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Person Name"
                size="small"
                fullWidth
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={type}
                  label="Type"
                  onChange={(e) => {
                    setType(e.target.value);
                    if (e.target.value === "deposit") setCategory("");
                  }}
                >
                  <MenuItem value="deposit">Deposit</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {type === "expense" && (
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Category"
                  size="small"
                  fullWidth
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Amount (₹)"
                size="small"
                type="number"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Date"
                size="small"
                type="date"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
                inputProps={{ max: today.toISOString().slice(0, 10) }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1}>
              <Button fullWidth variant="contained" onClick={handleSubmit}>
                Add
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button fullWidth variant="outlined" onClick={exportToExcel}>
                Export
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* === FILTERS === */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Filter by Person</InputLabel>
                <Select
                  value={filterPerson}
                  label="Filter by Person"
                  onChange={(e) => setFilterPerson(e.target.value)}
                >
                  <MenuItem value="all">All Persons</MenuItem>
                  {uniquePersons.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Filter by Month"
                type="month"
                size="small"
                fullWidth
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilterPerson("all");
                  setFilterMonth("");
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* === 📊 CHART SECTION === */}
        {chartData.length > 0 && (
          <Paper sx={{ p: 2, mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, textAlign: "center", color: "#0d47a1" }}
            >
              Monthly Deposits vs Expenses
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deposit" fill="#2e7d32" name="Deposits" />
                <Bar dataKey="expense" fill="#c62828" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {/* === DISPLAY DATA (ORIGINAL MONTHLY VIEW) === */}
        {Object.entries(groupedData).map(([personName, months]) => (
          <Box key={personName} sx={{ mb: 5 }}>
            <Typography
              variant="h5"
              sx={{ mb: 2, color: "#1565c0", textAlign: "center" }}
            >
              Person: {personName}
            </Typography>

            {months.map(
              ({
                month,
                monthStartingBalance,
                totalDeposits,
                totalExpenses,
                monthEndingBalance,
                entries,
              }) => (
                <Paper key={month} sx={{ p: 2, mb: 4, bgcolor: "#e3f2fd" }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, textAlign: "center", color: "#0d47a1" }}
                  >
                    {formatMonth(month)}
                  </Typography>

                  {/* === SUMMARY BOXES WITH COLORS === */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="subtitle2">Starting</Typography>
                        <Typography fontWeight="bold" color="#1976d2">
                          ₹{monthStartingBalance.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="subtitle2">Deposits</Typography>
                        <Typography fontWeight="bold" color="#2e7d32">
                          ₹{totalDeposits.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="subtitle2">Expenses</Typography>
                        <Typography fontWeight="bold" color="#c62828">
                          ₹{totalExpenses.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="subtitle2">Ending</Typography>
                        <Typography fontWeight="bold" color="#f57c00">
                          ₹{monthEndingBalance.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* === TABLE WITH ROW COLORS === */}
                  <TableContainer sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount (₹)</TableCell>
                          <TableCell align="right">
                            Running Balance (₹)
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow
                            key={entry._id || entry.id}
                            sx={{
                              bgcolor:
                                entry.type === "deposit"
                                  ? "#e8f5e9"
                                  : "#ffebee",
                            }}
                          >
                            <TableCell>{entry.date}</TableCell>
                            <TableCell
                              sx={{
                                textTransform: "capitalize",
                                color:
                                  entry.type === "deposit"
                                    ? "#2e7d32"
                                    : "#c62828",
                                fontWeight: "bold",
                              }}
                            >
                              {entry.type}
                            </TableCell>
                            <TableCell>{entry.category}</TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color:
                                  entry.type === "deposit"
                                    ? "#2e7d32"
                                    : "#c62828",
                                fontWeight: "bold",
                              }}
                            >
                              {entry.amount.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              {entry.runningBalance.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )
            )}
          </Box>
        ))}
      </Box>
    </>
  );
};

export default MoneyManager;
