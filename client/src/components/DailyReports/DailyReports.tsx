import { useState, useEffect } from "react";
import "./DailyReports.scss";
//import Loader from "react-loader-spinner";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
//import { format, utcToZonedTime } from "date-fns-tz";
import { toast } from "react-toastify";
import moment from "moment-timezone";
import { useFetchTransactions } from "./useFetchTransactions";
import DateSelector from "./DateSelector";
import React from "react";
import ReactDOM from "react-dom";

interface Product {
  id: string;
  sku: string;
  product: {
    id: string;
    title: string;
  };
  inventoryQuantity: number;
  inventoryItem: {
    id: any;
    inventoryLevels: {
      edges: Array<{
        node: {
          id: string;
          available: number;
        };
      }>;
    };
  };
}

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  message,
  onConfirm,
  onCancel,
}) => {
  return ReactDOM.createPortal(
    <div className="confirm-overlay">
      <div className="confirm-box">
        <p>{message}</p>
        <div className="confirm-buttons">
          <button onClick={onConfirm}>Yes</button>
          <button onClick={onCancel}>No</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function DailyReports() {
  const getTodaysDate = () => {
    return moment.tz("America/Chicago").format("MMDDYY");
  };

  const getTodaysDateValue = () => {
    return moment.tz("America/Chicago").format("YYYY-MM-DD");
  };

  const [todayDate, setTodayDate] = useState(getTodaysDate());
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [startDateRegister, setStartDateRegister] = useState<
    string | undefined
  >(undefined);
  const [endDateRegister, setEndDateRegister] = useState<string | undefined>(
    undefined
  );
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [todaysDateValue, setTodaysDateValue] = useState(getTodaysDateValue());
  const [procTotals, setProcTotals] = useState<any[]>([[], [], []]);
  const [procTotal, setProcTotal] = useState(0);
  const [triggerDateChange, setTriggerDateChange] = useState(0);
  const { transactionArray, waiting, setTriggerAbort, resetTransactionArray } =
    useFetchTransactions({
      startDate,
      endDate,
      startDateRegister,
      endDateRegister,
      triggerDateChange,
    });

  const [itemList, setItemList] = useState<any[]>([]);
  const [attendanceCount, setAttendanceCount] = useState<number | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [updatedInventory, setUpdatedInventory] = useState({});
  const [totalTaxFree, setTotalTaxFree] = useState(0);
  const [refreshAttendance, setRefreshAttendance] = useState(0);
  const [visitorCount, setVisitorCount] = useState<any>({
    BFF: 0,
    "Gift Card": 0,
    GoKarts: 0,
    Group: 0,
    Indoor: 0,
    "Last 3 Hours": 0,
    Member: 0,
    Online: 0,
    Party: 0,
    Switchback: 0,
    Unlimited: 0,
    "Walk-In": 0,
  });
  const [calendarCount, setCalendarCount] = useState<any>({
    Street: 0,
    Online: 0,
    Group: 0,
    Member: 0,
    "Gift Card": 0,
    "Online Gift Cards": 0,
    "Online Groups": 0,
  });

  const [confirmQueue, setConfirmQueue] = useState<
    { message: string; action: () => void }[]
  >([]);

  const showConfirm = (message: string, action: () => void) => {
    setConfirmQueue((prev) => [...prev, { message, action }]);
  };

  const handleConfirm = () => {
    if (confirmQueue.length === 0) return;
    const [{ action }, ...rest] = confirmQueue;
    action(); // run the stored callback
    setConfirmQueue(rest); // show the next confirm (if any)
  };

  const handleCancelConfirm = () => {
    setConfirmQueue(([, ...rest]) => rest);
  };

  const getHours = async () => {
    try {
      const res = await fetch(`/api/metafield/hours`, {
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      const info = await res.json();
      const hrs = info.data.shop.metafields.edges[0].node.value;
      const hrsp = JSON.parse(hrs);
      return hrsp;
    } catch (error) {
      // Handle the error
      console.error(error);
    }
  };

  const dateFormatter = (d) => {
    return d.format("YYYY-MM-DD");
  };

  const plusOneDay = (d) => {
    return d.clone().add(1, "day");
  };

  const minusOneDay = (d) => {
    return d.clone().subtract(1, "day");
  };

  const thisHours = (date, hrs) => {
    if (date && hrs) {
      try {
        let dy = date.split("-")[0].split("20")[1];
        dy = parseInt(dy, 10);
        const dm = parseInt(date.split("-")[1], 10) - 1;
        const dd = parseInt(date.split("-")[2], 10);
        
        // Check if nested arrays exist before accessing
        if (hrs[dy] && hrs[dy][dm] && hrs[dy][dm][dd] !== undefined) {
          const data = hrs[dy][dm][dd];
          return `${data}`;
        }
        return null;
      } catch (error) {
        console.error("Error in thisHours:", error);
        return null;
      }
    } else {
      return null;
    }
  };

  useEffect(() => {
    //$1('products changed:  ',products)
  }, [products]);

  useEffect(() => {
    //console.log('totalTaxFree updated',totalTaxFree)
  }, [totalTaxFree]);

  useEffect(() => {
    setProcTotals([[], [], []]);
    setProcTotal(0);
    resetTransactionArray();
  }, [startDate, endDate, startDateRegister, endDateRegister, todayDate]); //reset processor totals when dates change

  useEffect(() => {
    //$1('fetching products by date: ',todayDate)
    fetchProductsByDate(todayDate);
  }, [endDateRegister, todayDate]); //reset processor totals when dates change

  useEffect(() => {
    //console.log("transactionArray:", transactionArray);
    //console.log('array changed:',transactionArray)
    listSalesByProcessor();
    listItems();
  }, [transactionArray]);

  useEffect(() => {
    //create category totals when itemList updates
    let catArray: string[] = [];
    for (let i = 0; i < itemList.length; i++) {
      catArray[i] = itemList[i].category;
    }
    catArray = Array.from(new Set(catArray)).sort();
    const amtArray = new Array(catArray.length).fill(0);
    const countArray = new Array(catArray.length).fill(0);
    for (let ii = 0; ii < itemList.length; ii++) {
      const item = itemList[ii];
      for (let j = 0; j < catArray.length; j++) {
        if (item.category === catArray[j]) {
          amtArray[j] += item.totalPrice;
          countArray[j] += item.quantity;
        }
      }
    }
  }, [itemList]);

  useEffect(() => {
    //set all dates based on todaysDateValue
    const fetchVisitsForToday = async (date) => {
      try {
        const formattedDate = moment(endDateRegister).format("MM/DD/YY");
        const formattedStartingDate =
          moment(startDateRegister).format("MM/DD/YY");

        const response = await fetch(
          `/api/get-visits-by-date?date=${formattedDate}&startingdate=${formattedStartingDate}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();

        const uniqueMembers = new Set();

        data.forEach((visit) => {
          if (visit.membership_number) {
            uniqueMembers.add(visit.membership_number);
          }
        });

        const uniqueVisitCount = uniqueMembers.size;
        const visitCount = data.length;
        // You can set state or perform other actions based on the visit counts here
      } catch (error) {
        console.error("Error fetching visits:", error);
      }
    };

    const fetchGCsForToday = async (date) => {
      try {
        const formattedDate = moment(todaysDateValue).format("MM/DD/YY");

        const response = await fetch(
          `/api/get-gift-cards-by-date?date=${formattedDate}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        const gcCount = data.filter(
          (cert) => cert.is_donation === false
        ).length;
        const dCount = data.filter((cert) => cert.is_donation === true).length;
        // You can set state or perform other actions based on gcCount and dCount here
      } catch (error) {
        console.error("Error fetching GCs:", error);
      }
    };
    console.log('running todaysDateValue useEffect')
    getHours().then((hrs) => {
      const today = moment.tz(todaysDateValue, "America/Chicago");
      let todayRegister = today.clone();
      //$1('Initial todayRegister:', dateFormatter(todayRegister));

      let dayCounter = 0;
      while (
        !thisHours(dateFormatter(todayRegister), hrs) &&
        dayCounter <= 30
      ) {
        todayRegister = plusOneDay(todayRegister);
        dayCounter += 1;
        //$1(`Adding one day - attempt ${dayCounter}: `, dateFormatter(todayRegister));
      }

      //$1('Final todayRegister with hours:', dateFormatter(todayRegister));

      const yesterday = minusOneDay(todayRegister);
      let initStartDate = yesterday.clone();
      let initStartDateRegister = todayRegister.clone();

      let wc = 0;
      while (!thisHours(dateFormatter(initStartDate), hrs) && wc <= 30) {
        initStartDate = minusOneDay(initStartDate);
        initStartDateRegister = minusOneDay(initStartDateRegister);
        //$1(`Looking back - attempt ${wc + 1}: `, dateFormatter(initStartDate));
        wc += 1;
      }

      //$1('Init Start Date Register:', dateFormatter(initStartDateRegister));

      // New date values
      const newTodayDate = dateFormatter(todayRegister);
      const newStartDate = dateFormatter(initStartDate);
      const newStartDateRegister = dateFormatter(initStartDateRegister);
      const newEndDate = dateFormatter(yesterday);
      const newEndDateRegister = dateFormatter(todayRegister);

      // Update state only if values have changed
      if (todayDate !== newTodayDate) {
        setTodayDate(newTodayDate);
      }
      if (startDate !== newStartDate) {
        setStartDate(newStartDate);
      }
      if (startDateRegister !== newStartDateRegister) {
        setStartDateRegister(newStartDateRegister);
      }
      if (endDate !== newEndDate) {
        setEndDate(newEndDate);
      }
      if (endDateRegister !== newEndDateRegister) {
        setEndDateRegister(newEndDateRegister);
      }
    });

    if (todaysDateValue) {
      const today = new Date(todaysDateValue);
      fetchVisitsForToday(today);
      fetchGCsForToday(today);
    }
  }, [todaysDateValue]); // Dependency array includes todaysDateValue

  useEffect(() => {
    //fetch attendance when dates change
    if (!todaysDateValue || !startDateRegister || !endDateRegister) return;
    fetch("/api/get-attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        date: todaysDateValue,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        type AttendanceObject = {
          id: number;
          category: string;
          timestamp: string;
          quantity: number;
          order_number: string;
          date: string;
          cancelled: boolean;
        };

        const attendenceObjects: AttendanceObject[] = data;

        const attCounts = {
          BFF: 0,
          "Gift Card": 0,
          GoKarts: 0,
          Group: 0,
          Indoor: 0,
          "Last 3 Hours": 0,
          Member: 0,
          Online: 0,
          Party: 0,
          Switchback: 0,
          Unlimited: 0,
          "Walk-In": 0,
        };

        attendenceObjects.forEach((attend) => {
          if (!attend.cancelled) {
            const thisCategory = attend.category;
            attCounts[thisCategory] =
              (attCounts[thisCategory] || 0) + Number(attend.quantity);
          }
        });

        setVisitorCount(attCounts);
        // Handle success - e.g., update UI or state
        fetch("/api/get-calendar-attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            date: endDateRegister,
            startDate: startDateRegister,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            //$1("calendar attendance data:", data);

            const attendenceObjects: AttendanceObject[] = data;

            const attCounts = {
              Street: 0,
              Online: 0,
              Group: 0,
              Member: 0,
              "Gift Card": 0,
              "Online Gift Cards": 0,
              "Online Groups": 0,
            };

            attendenceObjects.forEach((attend) => {
              if (!attend.cancelled) {
                const thisCategory = attend.category;
                attCounts[thisCategory] =
                  (attCounts[thisCategory] || 0) + Number(attend.quantity);
              }
            });

            setCalendarCount(attCounts);
            // Handle success - e.g., update UI or state
          })
          .catch((error) => {
            // Handle error - e.g., show error message to user
          });
      })
      .catch((error) => {
        // Handle error - e.g., show error message to user
      });
  }, [todaysDateValue, refreshAttendance, startDateRegister, endDateRegister]);

  const fetchProductsByDate = (date) => {
    //if date is in a string like yyyy-mm-dd, change it to mmddyy
    if (date.length === 10) {
      date =
        date.substring(5, 7) + date.substring(8, 10) + date.substring(2, 4);
      //$1('date: ', date)
    }

    //if date is in a string like mmddyy, continue
    if (date.length === 6) {
      fetch(`/api/search-variants/${date}`, {
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setProducts(data.data.productVariants.edges.map((edge) => edge.node));
        })
        .catch((error) => console.error(error.message));
    }
  };

  const listSalesByProcessor = () => {
    let procArray: any[] = [];
    let paydateArray: any[] = [];
    let ttl = 0;

    for (let ii = 0; ii < transactionArray.length; ii++) {
      procArray[ii] = transactionArray[ii]?.gateway;
      paydateArray[ii] = transactionArray[ii]?.paydate;
    }

    // Create unique sets of processors and paydates, and sort them
    procArray = Array.from(new Set(procArray)).sort();
    paydateArray = Array.from(new Set(paydateArray)).sort();

    // Preferred processors
    const preferredProcessors = [
      "Shopify Payments",
      "Stripe",
      "Cash",
      "Quickbooks Payments",
      "ACH",
    ];
    const ignoredProcessors = ["Na"];

    // Merge preferred processors with discovered processors, ensuring all preferred are included
    if (transactionArray.length > 0) {
      procArray = [
        ...preferredProcessors,
        ...procArray.filter(
          (proc) =>
            !preferredProcessors.some(
              (preferredProc) =>
                preferredProc.toLowerCase() === proc.toLowerCase()
            ) &&
            !ignoredProcessors.some(
              (ignoredProc) => ignoredProc.toLowerCase() === proc.toLowerCase()
            )
        ),
      ];
    }
    // 2D array initialization for processor/paydate combinations
    const procAndPaydateArray = [procArray, paydateArray];

    // Initialize 2D arrays for storing amounts and fees
    const amtArray = Array(procArray.length)
      .fill([])
      .map(() => Array(paydateArray.length).fill(0));
    const feeArray = Array(procArray.length)
      .fill([])
      .map(() => Array(paydateArray.length).fill(0));

    // Calculate totals for each processor and paydate
    transactionArray.forEach((transaction) => {
      const paydateIndex = paydateArray.indexOf(transaction.paydate);
      const processorIndex = procArray.findIndex(
        (proc) => proc.toLowerCase() === transaction.gateway.toLowerCase()
      );
      if (paydateIndex !== -1 && processorIndex !== -1) {
        const amount = Number(transaction.amount);
        const fees = Number(transaction.fees);

        // Update amount and fees for this transaction
        amtArray[processorIndex][paydateIndex] += amount;
        feeArray[processorIndex][paydateIndex] += fees;

        // Update total transactions amount
        ttl += amount;
      }
    });

    // Store the totals and 2D arrays in your state or wherever needed
    setProcTotals([procAndPaydateArray, amtArray, feeArray]);
    setProcTotal(ttl);
  };

  const deleteVariant = async (variantId) => {
    try {
      await fetch(`/api/delete-variant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          variantId: variantId,
        }),
      });

      setUpdatedInventory((prevInventory) => ({
        ...prevInventory,
        [variantId]: 0,
      }));
    } catch (error) {
      console.error("Error deleting variant:", error);
    }
  };
  const deleteProduct = async (productId) => {
    try {
      await fetch(`/api/delete-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          productId: productId,
        }),
      });
    } catch (error) {
      console.error("Error deleting variant:", error);
    }
  };
  const resetInventory = async (variantId) => {
    try {
      await fetch(`/api/update-inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          variantId: variantId,
          quantity: 0,
        }),
      });

      setUpdatedInventory((prevInventory) => ({
        ...prevInventory,
        [variantId]: 0,
      }));
    } catch (error) {
      console.error("Error resetting inventory:", error);
    }
  };
  const hasNumbers = (str) => /\d/.test(str);

  const resetAll = async (products): Promise<void> => {
    const promises: Promise<any>[] = [];

    for (const product of products) {
      if (product.product.title.includes("Party")) {
        promises.push(deleteProduct(product.product.id));
      } else if (hasNumbers(product.sku)) {
        promises.push(deleteVariant(product.id));
      } else {
        if (product.inventoryQuantity !== 0) {
          promises.push(resetInventory(product.inventoryItem.id));
        }
      }
    }

    await Promise.all(promises);
    toast.success("All Products have been reset or deleted!", {
      position: toast.POSITION.TOP_RIGHT,
    });
  };

  const renderProducts = () => {
    //const filteredProducts = products.filter((product) => product.inventoryQuantity < 0);
    const filteredProducts = [...products];
    //$1('filtered products: ',filteredProducts)
    /*
		const totalAttendanceCount = filteredProducts.reduce((acc, product) => {
			const attendanceCount = product.sku.includes("SDFD")
			? Math.abs(product.inventoryQuantity) * 4
			: Math.abs(product.inventoryQuantity);
			return acc + attendanceCount;
		}, 0);*/
    //console.log('checking: ',filteredProducts)
    const totalAttendanceCount = filteredProducts.reduce((acc, product) => {
      //console.log('checking: ',product.product.title)
      const attendanceCount = product.sku.includes("FFP")
        ? Math.abs(product.inventoryQuantity) * 4
        : product.product.title.includes("Party")
        ? 0
        : Math.abs(product.inventoryQuantity);
      return acc + attendanceCount;
    }, 0);

    const renderResetOrDeleteButton = (product) => {
      if (hasNumbers(product.sku)) {
        return (
          <button
            className="deleteButton"
            onClick={() => deleteVariant(product.id)}
          >
            Delete
          </button>
        );
      } else {
        return (
          <button
            className="resetButton"
            onClick={() => resetInventory(product.inventoryItem.id)}
          >
            Reset
          </button>
        );
      }
    };

    if (procTotals[1][0]) {
      return (
        <div>
          <br />
          <br />
          <table className="report-table">
            <thead>
              <tr>
                <th>Title </th>
                <th> SKU </th>
                <th> Inventory </th>
                <th> Attendance Count </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const attendanceCount = product.sku.includes("FFP")
                  ? Math.abs(product.inventoryQuantity) * 4
                  : product.product.title.includes("Party")
                  ? 0
                  : Math.abs(product.inventoryQuantity);
                const updatedInventoryQuantity =
                  updatedInventory[
                    product.inventoryItem.inventoryLevels.edges[0].node.id
                  ];
                return (
                  <tr key={product.id}>
                    <td>{product.product.title} </td>
                    <td> {product.sku} </td>
                    <td>
                      {" "}
                      {updatedInventoryQuantity !== undefined
                        ? updatedInventoryQuantity
                        : Math.abs(product.inventoryQuantity)}
                    </td>
                    <td> {attendanceCount} </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>Total </td>
                <td> </td>
                <td> </td>
                <td id="todayAttendanceCount"> {totalAttendanceCount} </td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    } else {
      return;
    }
  };

  const createProcReport = () => {
    if (procTotal !== 0) {
      //let procTtl = 0;
      const dateRows = procTotals[0][1].map((date, y) => {
        const processorCols = procTotals[0][0].map((processor, i) => (
          <React.Fragment key={`processor-col-${y}-${i}`}>
            <td key={`col-${i}-${y}`}>{procTotals[1][i][y].toFixed(2)} </td>
            <td key={`fee-${i}-${y}`}>{procTotals[2][i][y].toFixed(2)} </td>
          </React.Fragment>
        ));

        if (y === procTotals[0][1].length - 1) {
          return <tr key={`date-row-${date}-${y}`}>{processorCols}</tr>;
        }
      });

      if (procTotals[0][1].length > 1) {
        const previousDatesRow = procTotals[0][0].map((processor, i) => {
          const [totalSales, totalFees] = procTotals[1][i].slice(0, -1).reduce(
            (acc, value, j) => {
              acc[0] += procTotals[1][i][j];
              acc[1] += procTotals[2][i][j];
              return acc;
            },
            [0, 0]
          );
          //procTtl += totalSales;
          return (
            <>
              <td>{totalSales.toFixed(2)}</td>
              <td> {totalFees.toFixed(2)} </td>
            </>
          );
        });
        dateRows.splice(
          -2,
          1,
          <tr key="previousDatesRow">{previousDatesRow}</tr>
        );
      } //else {
      //console.log(`reducing ${procTotals[1]}...`)
      //procTtl = procTotals[1].reduce((a,b) => a + b.reduce((a,b) => a + b), 0);
      //}
      //console.log('procTtl: ',procTtl)
      //const referencepoint = React.createRef();
      return (
        <div>
          <button className="smallButton" onClick={finalizeReport}>
            Finalize Report
          </button>
          <h2>Total Sales: $ {procTotal.toFixed(2)} </h2>
          <br />
          <table className="salesByProcessor report-table" id="procsales">
            <thead>
              <tr>
                <th colSpan={2 * procTotals[0][0].length + 1}>
                  {" "}
                  Sales By Processor{" "}
                </th>
              </tr>
              <tr>
                {procTotals[0][0].map((processor) => (
                  <>
                    <th>{processor} </th>
                    <th> Fees </th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>{dateRows}</tbody>
          </table>
        </div>
      );
    } else {
      if (waiting) {
        return (
          <div>
            <br />
            <br /> <br />
            <br />
            <button className="smallButton" onClick={abort}>
              {" "}
              Abort Search{" "}
            </button>
          </div>
        );
      } else {
        return <div></div>;
      }
    }
  };

  const listItems = () => {
    const itemArray = [];
    let attCount = 0;
    let onlineGCCount = 0;
    let onlineGroupCount = 0;
    let regCount = 0;

    for (let i = 0; i < transactionArray.length; i++) {
      const tran = transactionArray[i];
      // Handle POS refund items
      for (let j = 0; j < (tran?.POSrefundItems?.length || 0); j++) {
        const item = tran.POSrefundItems[j]?.node;
        console.log("pos refund item: ", item);
        if (item?.lineItem?.title) {
          const itemPrice = item.quantity * item.priceSet.shopMoney.amount * -1;
          itemArray.push({
            title: item.lineItem.title,
            quantity: item.quantity * -1,
            taxed: tran.taxLines ? 1 : 0,
            price: item.priceSet.shopMoney.amount * -1,
            totalPrice: itemPrice,
            category: "",
            source: transactionArray[i].source,
            vendor: item.lineItem.vendor || "",
            taxExemptTransaction: tran.taxExempt ? true : false,
          });
        }
      }

      // Handle sales and refund items
      const isRefund = (transactionArray[i].amount || 0) < 0;
      const transactionItems = isRefund ? tran.refundItems : tran.items;
      if (transactionItems && transactionItems.length > 0) {
        itemArray.push({
          title: "Sales Tax",
          quantity: isRefund ? -1 : 1,
          taxed: 1,
          price: isRefund
            ? -transactionArray[i].taxTotal
            : transactionArray[i].taxTotal,
          totalPrice: isRefund
            ? -transactionArray[i].taxTotal
            : transactionArray[i].taxTotal,
          category: "",
          source: transactionArray[i].source,
          taxExemptTransaction: tran.taxExempt ? true : false,
        });

        for (let j = 0; j < transactionItems.length; j++) {
          const item = transactionItems[j]?.node;
          if (item) {
            const itemTotalPrice = isRefund
              ? item.quantity * item.priceSet.shopMoney.amount * -1
              : item.quantity * item.discountedUnitPriceSet.shopMoney.amount;

            const itemPrice = isRefund
              ? item.priceSet.shopMoney.amount * -1
              : item.discountedUnitPriceSet.shopMoney.amount;

            let itemTitle = isRefund ? item.lineItem.title : item.title;

            //add a payment tag to the item title if it's a seal subsequent order
            if (
              transactionArray[i].tags?.some((tag) =>
                /^seal_subsequent_order_\d+$/.test(tag)
              ) &&
              Math.abs(itemPrice) < 15
            ) {
              itemTitle += " (Payment)";
            }

            const taxed =
              (transactionArray[i].taxLines &&
                transactionArray[i].taxLines.length > 0 &&
                item.taxable) ||
              (item.lineItem && item.lineItem.taxable) ||
              item.taxable;

            const quant = isRefund ? item.quantity * -1 : item.quantity;
            itemArray.push({
              title: itemTitle,
              quantity: quant,
              taxed: taxed ? 1 : 0,
              price: itemPrice,
              totalPrice: itemTotalPrice,
              category: "",
              source: transactionArray[i].source,
              vendor: isRefund ? item.lineItem.vendor : item.vendor || "",
              taxExemptTransaction: tran.taxExempt ? true : false,
              tags: transactionArray[i].tags,
            });
            if (itemTitle.toLowerCase().includes("group")) {
              console.log("not taxed item: ", itemTitle, quant, taxed, item);
            }
          }
        }
      }
    }

    for (let i = 0; i < itemArray.length; i++) {
      const item = itemArray[i];

      if (item.vendor?.match(/merchandise/i)) {
        item.category = "Merchandise";
      } else if (item.vendor?.match(/food|drinks|bottled drinks/i)) {
        item.category = "Food";
      } else if (item.vendor?.match(/consignment/i)) {
        item.category = "Consignment";
        if (item.source === "POS") regCount += item.quantity;
        else if (item.source !== "POS") onlineGCCount += item.quantity;
      } else if (item.vendor?.match(/groups/i)) {
        item.category = "Groups";
        if (item.source === "POS" && !item.title?.includes("Serving"))
          regCount += item.quantity;
        else if (
          item.source !== "POS" &&
          !item.title?.includes("Serving") &&
          !item.title?.includes("Food")
        )
          onlineGroupCount += item.quantity;
      } else if (item.vendor?.match(/parties/i)) {
        item.category = "Parties";
        if (item.source === "POS" && !item.title?.includes("Serving"))
          regCount += item.quantity;
        else if (
          item.source !== "POS" &&
          !item.title?.includes("Serving") &&
          !item.title?.includes("Food")
        )
          attCount += item.quantity;
      } else if (item.vendor?.includes("Admission")) {
        item.category = "Admission";
        if (item.source === "POS") regCount += item.quantity;
        else if (item.source !== "POS") attCount += item.quantity;
      } else if (item.vendor?.includes("4-Packs")) {
        item.category = "Admission";
        if (item.source === "POS") regCount += item.quantity * 4;
        else if (item.source !== "POS") attCount += item.quantity * 4;
      } else if (item.vendor?.includes("Consignment")) {
        item.category = "Consignment";
        if (item.source === "POS") regCount += item.quantity;
        else if (item.source !== "POS") onlineGCCount += item.quantity;
      } else if (
        item.title?.includes("Party") &&
        !item.title?.includes("Deposit")
      ) {
        item.category = "Parties";
      } else if (item.title?.includes("GetOutPass")) {
        item.category = "Consignment";
        if (item.source !== "POS") onlineGCCount += item.quantity || 1;
        else regCount += item.quantity || 1;
      } else if (item.title?.includes("Gift")) {
        item.category = "Gift Cards";
        if (item.source !== "POS") onlineGCCount += item.quantity || 1;
      } else if (
        item.title?.includes("Meal Wristband") ||
        item.title?.includes("Upgrade to Eat & Play Combo")
      ) {
        item.category = "Food";
      } else if (item.title?.includes("Member")) {
        item.category = "Memberships";
        if (!item.title?.includes("Payment") && item.source !== "POS") {
          onlineGCCount += item.quantity || 1;
        }
      } else if (item.title?.includes("Pass")) {
        item.category = "Passes";
      } else if (
        item.title?.includes("Fun Pack") ||
        item.title?.includes("Friendzy")
      ) {
        item.category = "4-packs";
        if (item.source !== "POS") attCount += (item.quantity || 1) * 4;
        else regCount += (item.quantity || 1) * 4;
      } else if (item.title?.includes("Chaperone")) {
        item.category = "Groups";
      } else if (item.title?.includes("ITT Base")) {
        item.category = "Consignment";
        if (item.source !== "POS") onlineGCCount += item.quantity || 1;
        else regCount += item.quantity || 1;
      } else if (item.title?.includes("band")) {
        item.category = "Admission";
        if (item.source !== "POS") attCount += item.quantity || 1;
        else regCount += item.quantity || 1;
      } else if (item.title?.includes("Sales Tax")) {
        item.category = "Sales Tax";
      } else {
        item.category = "Other";
      }
    }

    // Filter tax-exempt transactions and calculate total tax-free amount
    let taxExemptTransactions = transactionArray.filter(
      (transaction) => transaction.taxExempt
    );
    taxExemptTransactions = taxExemptTransactions.filter(
      (transaction) =>
        Number(transaction.amount) !== 0.01 &&
        Number(transaction.amount) !== -0.01
    );
    //console.log('taxExemptTransactions: ', taxExemptTransactions);
    const taxFree = taxExemptTransactions.reduce((total, transaction) => {
      const amount = Number(transaction.amount) || 0;
      return total + amount;
    }, 0);
    setTotalTaxFree(taxFree);
    ///console.log('taxFree: ', taxFree);

    // Find all tax-exempt items using the itemArray
    const taxFreeItems = itemArray.filter(
      (item) =>
        item.taxed === 0 &&
        item.category !== "Consignment" &&
        !item.title.includes("Deposit") &&
        !item.taxExemptTransaction &&
        item.totalPrice > 0
    );
    //console.log('taxFreeItems: ', taxFreeItems);
    const totalTaxFreeItemsAmount = taxFreeItems.reduce(
      (acc, item) => acc + item.totalPrice,
      0
    );
    setTotalTaxFree((prev) => prev + totalTaxFreeItemsAmount);
    //console.log('totalTaxFreeItems: ', totalTaxFreeItemsAmount);

    setAttendanceCount(attCount);
    setItemList(itemArray);

    if (attCount && attCount !== calendarCount["Online"]) {
      //$1("need to correct the calendar count!");
      //$1(attCount, calendarCount["Online"]);
      const newCount = attCount - calendarCount["Online"];
      //$1("need to add: ", newCount);

      // Use window.confirm() to ask the user
      showConfirm(
        `The online attendance count (${attCount}) doesn't match the calendar count (${calendarCount["Online"]}). Do you want to submit a correction of ${newCount}?`,
        () => {
          const calendarObject = {
            category: "Online",
            quantity: newCount,
            date: todaysDateValue,
          };
          fetch("/api/add-calendar-attendance", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify(calendarObject),
          })
            .then((response) => response.json())
            .then((data) => {
              setRefreshAttendance((prev) => prev + 1);
              //$1("Correction submitted!");
              // Handle success - e.g., update UI or state
            })
            .catch((error) => {
              console.error("Error submitting correction:", error);
              // Handle error - e.g., show error message to user
            });
        }
      );
    }

    if (
      onlineGroupCount &&
      onlineGroupCount !== calendarCount["Online Groups"]
    ) {
      //$1("need to correct the calendar count!");
      //$1(onlineGroupCount, calendarCount["Online Groups"]);
      const newCount = onlineGroupCount - calendarCount["Online Groups"];
      //$1("need to add: ", newCount);

      // Use window.confirm() to ask the user
      showConfirm(
        `The online groups count (${onlineGroupCount}) doesn't match the calendar count (${calendarCount["Online Groups"]}). Do you want to submit a correction of ${newCount}?`,
        () => {
          const calendarObject = {
            category: "Online Groups",
            quantity: newCount,
            date: todaysDateValue,
          };
          fetch("/api/add-calendar-attendance", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify(calendarObject),
          })
            .then((response) => response.json())
            .then((data) => {
              setRefreshAttendance((prev) => prev + 1);
              //$1("Correction submitted!");
              // Handle success - e.g., update UI or state
            })
            .catch((error) => {
              console.error("Error submitting correction:", error);
              // Handle error - e.g., show error message to user
            });
        }
      );
    }
    if (onlineGCCount && onlineGCCount !== calendarCount["Online Gift Cards"]) {
      const newCount = onlineGCCount - calendarCount["Online Gift Cards"];

      // Use window.confirm() to ask the user
      showConfirm(
        `The online gift card count (${onlineGCCount}) doesn't match the calendar count (${calendarCount["Online Gift Cards"]}). Do you want to submit a correction of ${newCount}?`,
        () => {
          const calendarObject = {
            category: "Online Gift Cards",
            quantity: newCount,
            date: todaysDateValue,
          };
          fetch("/api/add-calendar-attendance", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify(calendarObject),
          })
            .then((response) => response.json())
            .then((data) => {
              setRefreshAttendance((prev) => prev + 1);
              //$1("Correction submitted!");
              // Handle success - e.g., update UI or state
            })
            .catch((error) => {
              console.error("Error submitting correction:", error);
              // Handle error - e.g., show error message to user
            });
        }
      );
    }
  };

  const taxFreeReport = () => {
    if (transactionArray.length == 0) {
      return;
    }
    let taxExemptTransactions = transactionArray.filter(
      (transaction) => transaction.taxExempt
    );

    //filter transactions with amounts of 0.01 or -0.01
    taxExemptTransactions = taxExemptTransactions.filter(
      (transaction) =>
        Number(transaction.amount) !== 0.01 &&
        Number(transaction.amount) !== -0.01
    );

    if (taxExemptTransactions.length === 0) {
      return;
    }

    return (
      <div className="tax-free-report">
        <h3>Tax-Exempt Transactions</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Transaction Amount</th>
              <th>Customer Name</th>
              <th>Customer Email</th>
            </tr>
          </thead>
          <tbody>
            {taxExemptTransactions.map((transaction, index) => (
              <tr key={index}>
                <td>{transaction.amount}</td>
                <td>{transaction.customer?.displayName || "N/A"}</td>
                <td>{transaction.customer?.email || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const taxFreeItemReport = () => {
    if (itemList.length === 0) {
      return;
    }

    // Filter out consignment items
    let taxFreeItems = itemList.filter(
      (item) =>
        item.taxed === 0 &&
        item.category !== "Consignment" &&
        !item.title.includes("Deposit") &&
        !item.taxExemptTransaction &&
        item.totalPrice !== 0
    );
    console.log("taxFreeItems: ", taxFreeItems);
    // Combine tax-free items with the same title, adding their amounts
    taxFreeItems = taxFreeItems.reduce((acc, item) => {
      const existingItem = acc.find((i) => i.title === item.title);
      if (existingItem) {
        existingItem.totalPrice += item.totalPrice;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, []);

    if (taxFreeItems.length === 0) {
      return;
    }

    return (
      <div className="tax-free-report">
        <h3>Tax-Exempt Items</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Item</th>
            </tr>
          </thead>
          <tbody>
            {taxFreeItems.map((item, index) => (
              <tr key={index}>
                <td>{item.totalPrice.toFixed(2)}</td>
                <td>{item.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const createItemReport = () => {
    if (procTotals[1][0]) {
      const items = itemList;
      //const itemArray = [["Item Name"], ["#"], ["$"], ["Category"]];
      const itemArray = [[], [], [], []];
      let amtTtl = 0;
      //console.log('items: ', items);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.title && item.title.includes("Party Deposit")) {
          item.title = "Party Deposit";
        }
        let matched = false;
        for (let j = 0; j < itemArray[0].length; j++) {
          const sameTitle = item.title === itemArray[0][j];
          const sameCategory = item.category === itemArray[3][j];
          if (!matched && sameTitle && sameCategory) {
            itemArray[1][j] += item.quantity;
            itemArray[2][j] = (
              parseFloat(itemArray[2][j]) + item.totalPrice
            ).toFixed(2);
            matched = true;
          }
        }

        if (!matched) {
          itemArray[0].push(item.title);
          itemArray[1].push(item.quantity);
          itemArray[2].push(item.totalPrice.toFixed(2));
          itemArray[3].push(item.category);
        }

        amtTtl += item.totalPrice;
      }

      // Sort the itemArray alphabetically by item name, ensuring that all items have defined titles
      const sortedItemArray = [[], [], [], []];
      const sortedIndexes = itemArray[0]
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item !== undefined && item !== null) // Filter out undefined or null titles
        .sort((a, b) => a.item.localeCompare(b.item))
        .map(({ index }) => index);

      sortedIndexes.forEach((sortedIndex) => {
        sortedItemArray[0].push(itemArray[0][sortedIndex]);
        sortedItemArray[1].push(itemArray[1][sortedIndex]);
        sortedItemArray[2].push(itemArray[2][sortedIndex]);
        sortedItemArray[3].push(itemArray[3][sortedIndex]);
      });

      if (amtTtl.toFixed(2) !== procTotal.toFixed(2)) {
        sortedItemArray[0].push("Other");
        sortedItemArray[1].push("-");
        sortedItemArray[2].push((procTotal - amtTtl).toFixed(2));
        sortedItemArray[3].push("-");
        amtTtl += procTotal - amtTtl;
      }

      sortedItemArray[0].push("Total");
      sortedItemArray[1].push("-");
      sortedItemArray[2].push(amtTtl.toFixed(2));
      sortedItemArray[3].push("-");

      sortedItemArray[0].unshift("Item");
      sortedItemArray[1].unshift("#");
      sortedItemArray[2].unshift("$");
      sortedItemArray[3].unshift("Category");

      return (
        <div>
          <div className="salesByItem">
            <h3>Sales by Item: </h3>
            <table className="salesByItem report-table">
              <tbody>
                {sortedItemArray.map((numList, i) => (
                  <tr key={i}>
                    {numList.map((num, j) => (
                      <td key={j}> {num} </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else {
      return <div></div>;
    }
  };

  const dateSearch = () => {
    setTriggerDateChange(triggerDateChange + 1);
  };

  const abort = () => {
    setTriggerAbort(true);
  };

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  if (window.location.href.includes("?go=true")) {
    const newUrl = window.location.href.split("?go=")[0];
    //console.log('new url: ',newUrl)
    window.history.pushState({}, "Daily Reports", newUrl);
    delay(500).then(() => dateSearch());
  }

  const copyToClipboard = () => {
    setIsCopying(true);
    const trs = [...document.querySelectorAll("#procsales tbody tr")];
    let tableData = trs
      .map((tr) => {
        const tds = [...tr.querySelectorAll("td")];
        return tds.map((td) => td.innerText).join("\t");
      })
      .join("\n");

    const catTableRow = [...document.querySelectorAll("#catTable tbody tr")][1];
    const catTableData = [...catTableRow.querySelectorAll("td")]
      .map((td) => td.innerText)
      .join("\t");

    tableData =
      tableData +
      "\n" +
      catTableData +
      "\n" +
      visitorCount["Online"] +
      "\t" +
      visitorCount["Member"] +
      "\t" +
      visitorCount["BFF"] +
      "\t" +
      visitorCount["Gift Card"] +
      "\t" +
      visitorCount["Unlimited"] +
      "\t" +
      visitorCount["Indoor"] +
      "\t" +
      visitorCount["Group"] +
      "\t" +
      visitorCount["GoKarts"] +
      "\t" +
      visitorCount["Last 3 Hours"] +
      "\t" +
      visitorCount["Party"] +
      "\t" +
      visitorCount["Switchback"] +
      "\t" +
      visitorCount["Walk-In"] +
      "\n" +
      calendarCount["Street"] +
      "\t" +
      calendarCount["Online"] +
      "\t" +
      calendarCount["Member"] +
      "\t" +
      calendarCount["Group"] +
      "\t" +
      calendarCount["Gift Card"] +
      "\t" +
      calendarCount["Online Gift Cards"] +
      "\t" +
      calendarCount["Online Groups"];

    if (trs.length === 1) {
      tableData = "0\t0\t0\t0\t\n" + tableData;
    }
    navigator.clipboard.writeText(tableData);
    toast.success("Report copied to clipboard!", {
      position: toast.POSITION.TOP_RIGHT,
    });
    setTimeout(() => setIsCopying(false), 1000);
  };

  const createCategoryReport = () => {
    if (procTotals[1][0]) {
      const categoryArray: any = [[], [], []];
      const possibleCategories = [
        "Passes",
        "Memberships",
        "Gift Cards",
        "Tax-Free Groups",
        "Merchandise",
        "Food",
        "Groups",
        "Parties",
        "Tax-Free",
        "Consignment",
      ];
      const categoryTotals = {};
      for (let i = 0; i < itemList.length; i++) {
        const item = itemList[i];
        const category = item.category;

        if (!categoryTotals[category]) {
          categoryTotals[category] = { quantity: 0, totalPrice: 0 };
        }
        categoryTotals[category].totalPrice += Number(item.totalPrice);
        categoryTotals[category].quantity += Number(item.quantity);
      }
      for (let i = 0; i < possibleCategories.length; i++) {
        const thisPossibleCategory = possibleCategories[i];
        let totalPrice = 0;
        let totalQuantity = 0;
        if (categoryTotals[thisPossibleCategory]) {
          totalPrice = categoryTotals[thisPossibleCategory].totalPrice;
          totalQuantity = categoryTotals[thisPossibleCategory].quantity;
        }
        categoryArray[0].push(thisPossibleCategory);
        if (thisPossibleCategory === "Tax-Free") {
          categoryArray[1].push(totalTaxFree.toFixed(2));
        } else {
          categoryArray[1].push(totalPrice.toFixed(2));
        }
        categoryArray[2].push(totalQuantity);
      }
      return (
        <div>
          <h3>Sales by Category: </h3>
          <table className="salesByCategory report-table" id="catTable">
            <tbody>
              {categoryArray.map((numList, i) => (
                <tr key={i}>
                  {numList.map((num, j) => (
                    <td key={j}> {num} </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      return <div></div>;
    }
  };

  const itemizedReport = () => {
    if (transactionArray.length == 0) {
      return;
    }
    return (
      <div className="itemizedReport newPage">
        <br />
        <br /> <hr />
        <br /> <br />
        <table className="report-table">
          <thead>
            <tr>
              <th>Total Amount </th>
              <th> Fee Amount </th>
              <th> Processor </th>
              <th> Estimated Payout Date </th>
              <th> Transaction Date </th>
            </tr>
          </thead>
          <tbody>
            {transactionArray.map((transaction, index) => (
              <tr key={index}>
                <td>{transaction.amount} </td>
                <td> {transaction.fees} </td>
                <td> {transaction.gateway} </td>
                <td> {transaction.paydate} </td>
                <td>
                  {" "}
                  {new Date(transaction.date || 0).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  ) +
                    " " +
                    new Date(transaction.date || 0).toLocaleTimeString()}{" "}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const finalizeReport = async () => {
    copyToClipboard();
    await resetAll(products);
    window.print();
  };

  return (
    <div className="reportswindow">
      <div className="report">
        <h1>Sales Report </h1>
        <DateSelector
          waiting={waiting}
          todaysDateValue={todaysDateValue}
          setTodaysDateValue={setTodaysDateValue}
          setTodayDate={setTodayDate}
          visitorCount={visitorCount}
          calendarCount={calendarCount}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          startDateRegister={startDateRegister}
          setStartDateRegister={setStartDateRegister}
          endDateRegister={endDateRegister}
          setEndDateRegister={setEndDateRegister}
          procTotals={procTotals}
          dateSearch={dateSearch}
        />
        {createProcReport()}
        {createCategoryReport()}
        {renderProducts()}
        {taxFreeReport()}
        {taxFreeItemReport()}
        {createItemReport()}
        {itemizedReport()}
        {confirmQueue.length > 0 && (
          <ConfirmDialog
            message={confirmQueue[0].message}
            onConfirm={handleConfirm}
            onCancel={handleCancelConfirm}
          />
        )}
      </div>
    </div>
  );
}
