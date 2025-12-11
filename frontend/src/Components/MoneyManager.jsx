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
} from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

  // Group and calculate running balances
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

  // Format month
  const formatMonth = (month) => {
    const [year, mon] = month.split("-");
    const date = new Date(year, mon - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Export to Excel
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
        sx={{ minHeight: "100vh", width: "100vw", bgcolor: "#f0f4f8", p: 3 }}
      >
        <Typography
          variant="h3"
          sx={{ mb: 3, color: "#1976d2", textAlign: "center" }}
        >
          Money Manager
        </Typography>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            mb: 4,
            p: 3,
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: 3,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TextField
            label="Person Name"
            size="small"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            required
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                if (e.target.value === "deposit") setCategory("");
              }}
              label="Type"
            >
              <MenuItem value="deposit">Deposit</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </Select>
          </FormControl>

          {type === "expense" && (
            <TextField
              label="Category"
              size="small"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              sx={{ minWidth: 150 }}
            />
          )}

          <TextField
            label="Amount (₹)"
            size="small"
            type="number"
            inputProps={{ step: "any", min: 0 }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            sx={{ minWidth: 150 }}
          />

          <TextField
            label="Date"
            size="small"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            inputProps={{ max: today.toISOString().slice(0, 10) }}
            sx={{ minWidth: 150 }}
            required
          />

          <Button variant="contained" type="submit" sx={{ height: "40px" }}>
            Submit
          </Button>
          <Button
            variant="outlined"
            onClick={exportToExcel}
            sx={{ height: "40px" }}
          >
            Export to Excel
          </Button>
        </Box>

        {/* Filters */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
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

          <TextField
            label="Filter by Month"
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            sx={{ minWidth: 150 }}
            inputProps={{ max: today.toISOString().slice(0, 7) }}
          />

          <Button
            variant="outlined"
            onClick={() => {
              setFilterPerson("all");
              setFilterMonth("");
            }}
            sx={{ height: "40px" }}
          >
            Clear Filters
          </Button>
        </Box>

        {/* Display Data */}
        {Object.keys(groupedData).length === 0 && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            No transactions found.
          </Typography>
        )}

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
                <Paper
                  key={month}
                  sx={{ p: 2, mb: 4, bgcolor: "#e3f2fd", boxShadow: 2 }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, color: "#0d47a1", textAlign: "center" }}
                  >
                    {formatMonth(month)}
                  </Typography>

                  {/* Summary Boxes */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-around",
                      mb: 1,
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ textAlign: "center", minWidth: 160 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold", color: "#0d47a1" }}
                      >
                        Starting Balance
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "#1976d2" }}
                      >
                        ₹{monthStartingBalance.toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: "center", minWidth: 120 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold", color: "#2e7d32" }}
                      >
                        Deposits
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "#388e3c" }}
                      >
                        ₹{totalDeposits.toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: "center", minWidth: 120 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold", color: "#b71c1c" }}
                      >
                        Expenses
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "#d32f2f" }}
                      >
                        ₹{totalExpenses.toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: "center", minWidth: 160 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold", color: "#f57c00" }}
                      >
                        Ending Balance
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "#fb8c00" }}
                      >
                        ₹{monthEndingBalance.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Entries Table */}
                  <TableContainer>
                    <Table size="small" aria-label="transactions table">
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
                          <TableRow key={entry._id || entry.id}>
                            <TableCell>{entry.date}</TableCell>
                            <TableCell
                              sx={{
                                textTransform: "capitalize",
                                color:
                                  entry.type === "deposit"
                                    ? "#388e3c"
                                    : "#d32f2f",
                                fontWeight: "bold",
                              }}
                            >
                              {entry.type}
                            </TableCell>
                            <TableCell>{entry.category}</TableCell>
                            <TableCell align="right">
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
