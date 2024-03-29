"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import * as XLSX from "xlsx";

const KotReport = () => {
  const currentDate = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);
  const [menuStatistics, setMenuStatistics] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://ec2-15-206-189-233.ap-south-1.compute.amazonaws.com:5000/api/order/menu-statistics${startDate && endDate
            ? `?startDate=${startDate}&endDate=${endDate}`
            : ""
          }`
        );
        setMenuStatistics(response.data.menuStatistics);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    // Calculate totals when menuStatistics changes
    let totalPriceSum = 0;
    let totalAmountSum = 0;
    let totalQuantitySum = 0;

    Object.keys(menuStatistics).forEach((menu) => {
      totalPriceSum += menuStatistics[menu].price;
      totalAmountSum += menuStatistics[menu].totalPrice;
      totalQuantitySum += menuStatistics[menu].totalQuantity;
    });

    setTotalPrice(totalPriceSum);
    setTotalAmount(totalAmountSum);
    setTotalQuantity(totalQuantitySum);
  }, [menuStatistics]);

  const printReport = () => {
    const printContent = Object.keys(menuStatistics).map((menu) => ({
      menuName: menu,
      quantity: menuStatistics[menu].totalQuantity,
      price: menuStatistics[menu].price,
      totalAmount: menuStatistics[menu].totalPrice,
    }));

    const tfootContent = `
      <tfoot>
        <tr>
          <td colSpan="1" className="py-2 px-4 border"></td>
          <td className="py-2 px-4 border font-semibold">
            Total:<br> ${totalQuantity}
          </td>
          <td className="py-2 px-4 border font-semibold">
            Total: ${totalPrice}
          </td>
          <td className="py-2 px-4 border font-semibold">
            Total: ${totalAmount}
          </td>
        </tr>
      </tfoot>
    `;

    const printableContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Report</title>
          <style>
  @page {
    size: 80(72.1)X 297 mm; /* Set the page size */
    margin: 2mm; /* Adjust the margin as needed */
  }

  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .report-header {
    margin-top: -11px;
    color: black;
    font-size: 17px;
    padding: 10px;
    text-align: center;
  }

  .date-range {
    font-size: 13px;
    margin: -4px 0;
    text-align: left;
  }

  .report-content {
    margin-top: 10px;
    width: 100%; /* Set the width of the content */
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }

  .table th, .table td {
    padding: 4px;
    text-align: center;
    border: 1px solid black;
  }

  .table .vertical-line {
    border-left: 1px solid black;
    border-right: 1px solid black;
  }

  .bg-gray-100 {
    border-bottom: 1px solid black;
    padding: 1px;
  }

  .label {
    font-weight: normal;
  }

  .value {
    font-weight: normal;
  }
</style>
        </head>
        <body>
        
        <div class="report-header">
          KOT Report
        </div>
        <div class="date-range">
          <br />
          Date Range: ${new Date(startDate).toLocaleDateString(
      "en-GB"
    )} - ${new Date(endDate).toLocaleDateString("en-GB")}
        </div>
        <div class="report-content">
          <table class="table">
            <thead>
              <tr class="bg-gray-100">
                <th class="label">Menu Name</th>
                <th class="vertical-line label">Quantity</th>
                <th class="vertical-line label">Price</th>
                <th class="vertical-line label">Total Amount</th>
              </tr>
            </thead>
            <tbody>
          ${printContent
        .map(
          (item) => `
            <tr class="bg-gray-100">
              <td class="value">${item.menuName}</td>
              <td class="vertical-line value">${item.quantity}</td>
              <td class="vertical-line value">${item.price}</td>
              <td class="vertical-line value">${item.totalAmount}</td>
            </tr>
          `
        )
        .join("")}
        </tbody>
        ${tfootContent}
      </table>
    </div>
  </body>
    </html>
  `;

    const printWindow = window.open("", "_self");

    if (!printWindow) {
      alert("Please allow pop-ups to print the report.");
      return;
    }

    printWindow.document.write(printableContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const exportToExcel = () => {
    const data = Object.keys(menuStatistics).map((menu) => ({
      MenuName: menu,
      Quantity: menuStatistics[menu].totalQuantity,
      Price: menuStatistics[menu].price,
      TotalAmount: menuStatistics[menu].totalPrice,
    }));

    // Add tfoot totals to the data array
    data.push(
      {
        MenuName: "",
        Quantity: totalQuantity,
        Price: totalPrice,
        TotalAmount: totalAmount,
      },
      {
        MenuName: "",
        Quantity: "",
        Price: "",
        TotalAmount: "",
      }
    );

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MenuStatistics");
    XLSX.writeFile(wb, "kot_Report.xlsx");
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto mt-6 p-8 bg-white rounded-md shadow-md font-sans">
        <h1 className="text-3xl font-bold mb-4">KOT Report</h1>
        <div className="mb-4">
          <label className="mr-2">Start Date:</label>
          <input
            type="date"
            className="border rounded-md text-gray-700 p-1 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label className="mx-2">End Date:</label>
          <input
            type="date"
            className="border rounded-md text-gray-700 p-1 text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button
            className="text-orange-600 ml-4 font-bold py-1 rounded-full text-sm bg-orange-100 mr-2 px-2 shadow-md"
            onClick={exportToExcel}
          >
            Export to Excel
          </button>
          <button
            className="text-green-600 ml-4 font-bold py-1 rounded-full text-sm bg-green-200 mr-2 px-4 shadow-md"
            onClick={printReport}
          >
            Print
          </button>
        </div>
        <div className="max-w-5xl pl-44">
          <table className="w-full border border-gray-300 text-center">
            <thead className="text-base bg-zinc-100 text-yellow-700 border">
              <tr className="bg-gray-200 text-center">
                <th className="py-2 px-4 border">SR No.</th>
                <th className="py-2 px-4 border">Menu Name</th>
                {/* <th className="py-2 px-4 border">Menu Count</th> */}
                <th className="py-2 px-4 border">Quantity</th>
                <th className="py-2 px-4 border">Price</th>{" "}
                {/* Add Price column */}
                <th className="py-2 px-4 border">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(menuStatistics).map((menu, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border">{index + 1}</td>
                  <td className="py-2 px-4 border">{menu}</td>
                  <td className="py-2 px-4 border">{menuStatistics[menu].totalQuantity}</td>
                  <td className="py-2 px-4 border">{menuStatistics[menu].price}</td>
                  <td className="py-2 px-4 border">{menuStatistics[menu].totalPrice}</td>
                </tr>


              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="py-2 px-4 border"></td>
                <td className="py-2 px-4 border font-semibold">
                  Total Quantity:{totalQuantity}
                </td>
                <td className="py-2 px-4 border font-semibold">
                  Total Price:{totalPrice}
                </td>
                <td className="py-2 px-4 border font-semibold">
                  Total Amount:{totalAmount}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
};

export default KotReport;