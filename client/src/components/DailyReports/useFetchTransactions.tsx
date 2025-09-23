import { useState, useEffect } from "react";
import moment from "moment";

interface TransactionItem {
  customer: any;
  taxExempt: unknown;
  amount?: number;
  gateway?: string;
  items?: any[]; // Define a more specific type here based on your actual data structure
  refundItems?: any[]; // Define a more specific type here
  fees?: number;
  taxTotal?: number;
  date?: string;
  paydate?: string;
  source?: "online" | "POS";
  title?: string;
  category?: string;
  vendor?: string;
  quantity?: number;
  taxed?: number;
  taxLines?: { priceSet: { shopMoney: { amount: number } } }[];
  price?: number;
  totalPrice?: number;
  POSrefundItems?: any[];
  POSrefundTransactions?: any[];
  tags?: string[];
}

export function useFetchTransactions({
  startDate,
  endDate,
  startDateRegister,
  endDateRegister,
  triggerDateChange,
}) {
  const [transactionArray, setTransactionArray] = useState([]);
  const [partialTransactionArray, setPartialTransactionArray] = useState([]);
  const [transactionCursor, setTransactionCursor] = useState("");
  const [anotherPage, setAnotherPage] = useState(false);
  const [triggerAnotherPage, setTriggerAnotherPage] = useState(0);
  const [triggerAnotherPOSPage, setTriggerAnotherPOSPage] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [triggerAbort, setTriggerAbort] = useState(false);
  const resultCount = 250;
  let processedLineItems = [];

  // Move the useEffects and any related functions into this hook

  const resetTransactionArray = () => {
    setTransactionArray([]);
    setPartialTransactionArray([]);
  };

  const getPayoutDate = (transactionDate: string): string => {
    const tdate = moment.utc(transactionDate); // Parse the transaction date as UTC
    let currentMonday = tdate.clone().isoWeekday(1).startOf("day"); // Monday at 00:00 UTC

    // If the transaction is after Monday midnight UTC, push to the next settlement
    if (tdate.isAfter(currentMonday.clone().add(1, "day"))) {
      currentMonday = currentMonday.add(1, "week");
    }

    // Add two days to Monday to calculate the Wednesday payout date
    return currentMonday.add(2, "days").format("YYYY-MM-DD");
  };

  useEffect(() => {
    setAnotherPage(false);
    processedLineItems = [];
    setTransactionArray([]);
    setPartialTransactionArray([]);
    setTriggerAnotherPage((prev) => prev + 1);
  }, [triggerDateChange]);

  useEffect(() => {
    //console.log('triggerDateChange: ',triggerDateChange)
    //Get all transactions each time the start or end date changes and fill in transaction array
    //console.log('tender count: ',tenderCount)
    if (triggerAbort) {
      setWaiting(false);
      //setStatusMessage('')
      setTransactionCursor("");
      setTriggerAbort(false);
    } else if (startDate && endDate) {
      //console.log('time to fetch...')
      setWaiting(true);
      //console.log('end date: ', endDate, 'yesterday: ',todayDate,todaysDateValue);
      //is end date yesterday?

      fetch(`/api/tender-transactions`, {
        method: "POST",
        body: JSON.stringify({
          startDate: startDate,
          endDate: endDate,
          num: resultCount,
          cursor: anotherPage ? transactionCursor : "",
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((response) => {
          if (response.errors) {
            //console.log(response.errors[0].message)
            let errWaitTime = 0;
            if (response.extensions && response.extensions.cost) {
              const errCost = response.extensions.cost.requestedQueryCost;
              const errAvail =
                response.extensions.cost.throttleStatus.currentlyAvailable;
              const errRr = response.extensions.cost.throttleStatus.restoreRate;
              if (errCost > errAvail) {
                errWaitTime = ((errCost - errAvail) / errRr) * 1000;
              }
            }
            const newEmptyArray = [];
            return [newEmptyArray, transactionCursor, errWaitTime];
          } else {
            //console.log('response:',response)
            const res = response.data.tenderTransactions.edges;
            //console.log('res:',res)
            const newArray: TransactionItem[] = [];

            for (let i = 0; i < res.length; i++) {
              if (!res[i]?.node?.order) {
                continue;
              }
              const amt = res[i].node.amount.amount;
              const date = res[i].node.processedAt;
              const taxExempt =
                res[i].node.order.customer?.taxExempt ||
                res[i].node.order.taxExempt;
              const customer = res[i].node.order.customer;
              const tags = res[i].node.order.tags || [];
              let transFees = 0;
              const taxLines = res[i]?.node?.order?.taxLines || [];
              let taxTotal = 0;
              taxLines.map((line) => {
                taxTotal += Number(line.priceSet.shopMoney.amount);
              });
              if (taxTotal > (amt / 1.0825) * 0.0825) {
                taxTotal = (amt / 1.0825) * 0.0825;
              }

              let gateway = "Other";
              gateway =
                res[i].node.order.transactions.find(
                  (trans) =>
                    trans.amountSet.shopMoney.amount === amt &&
                    trans.kind != "AUTHORIZATION"
                )?.formattedGateway ||
                res[i].node.order.transactions.find(
                  (trans) =>
                    trans.amountSet.shopMoney.amount * 1 === amt * -1 &&
                    trans.kind != "AUTHORIZATION"
                )?.formattedGateway ||
                "Other";
              if (gateway === "Other") {
                const refundTransactions = res[i].node.order.refunds?.find(
                  (refund) =>
                    Array.isArray(refund.transactions) &&
                    refund.transactions.some(
                      (transaction) =>
                        transaction.amountSet.shopMoney.amount === amt
                    )
                );
                if (refundTransactions) {
                  gateway =
                    refundTransactions.transactions.find(
                      (transaction) =>
                        transaction.amountSet.shopMoney.amount === amt
                    )?.formattedGateway || "Other";
                }
              }

              let refundItems: any[] = [];

              const paydate = getPayoutDate(date);

              let lineItems: any[] = [];
              if (amt > 0) {
                lineItems = res[i].node?.order?.lineItems?.edges || [];
                lineItems = lineItems.filter((item) => {
                  //console.log("checking: ", item.node.id, processedLineItems);
                  if (processedLineItems.includes(item.node.id)) {
                    //console.log("already in set");
                    return false; // Do not include this item in the new array
                  } else {
                    //console.log("adding to set: ", item.node.id);
                    processedLineItems.push(item.node.id);
                    return true; // Include this item in the new array
                  }
                });

                if (gateway?.includes("Stripe")) {
                  //console.log('fees:',res[i].node.order.transactions)
                  transFees = parseFloat((amt * 0.029 + 0.3).toFixed(2));
                } else if (gateway?.includes("Manual")) {
                  transFees = parseFloat((amt * 0.029 + 0.3).toFixed(2));
                } else {
                  for (
                    let j = 0;
                    j < res[i]?.node?.order?.transactions?.length;
                    j++
                  ) {
                    if (
                      amt ===
                        res[i].node.order.transactions[j].amountSet.shopMoney
                          .amount &&
                      res[i].node.order.transactions[j].fees.length > 0
                    ) {
                      //console.log('fees:',res[i].node.order.transactions[j].fees)
                      transFees =
                        res[i].node.order.transactions[j].fees[0].amount.amount;
                    }
                  }
                }
                //$1('transFees for:',amt,transFees,res[i].node.order.transactions)
              }
              if (amt < 0) {
                const refunds = res[i].node.order.refunds;
                //taxTotal = 0;
                //console.log('found a refund!',refunds)
                for (let jj = 0; jj < refunds.length; jj++) {
                  for (
                    let k = 0;
                    k < refunds[jj].transactions.edges.length;
                    k++
                  ) {
                    const transaction =
                      0 -
                      refunds[jj].transactions.edges[k].node.amountSet.shopMoney
                        .amount;
                    //console.log(`Does ${transaction} = ${amt}?`)
                    if (transaction == amt) {
                      refundItems = refunds[jj].refundLineItems.edges;
                      refundItems = refundItems.filter((item) => {
                        //console.log("checking: ", item.node.id,processedLineItems);
                        if (processedLineItems.includes(item.node.id)) {
                          //console.log('already in set')
                          return false; // Do not include this item in the new array
                        } else {
                          //console.log('adding to set: ',item.node.id)
                          processedLineItems.push(item.node.id);
                          return true; // Include this item in the new array
                        }
                      });
                      //console.log('yes!')
                    } else {
                      //console.log('no')
                    }
                  }
                }
                //console.log(refundItems)
              }
              if (gateway === "Manual") {
                gateway = "Stripe";
              }
              if (gateway === "Stripe" || gateway === "Shopify Payments") {
                newArray.push({
                  amount: res[i].node.amount.amount,
                  gateway: gateway,
                  items: lineItems,
                  refundItems: refundItems,
                  fees: transFees,
                  taxLines: taxLines,
                  taxTotal: Number(taxTotal.toFixed(2)),
                  date: date,
                  paydate: paydate,
                  source: "online",
                  taxExempt: taxExempt,
                  customer: customer,
                  tags: tags,
                });
              }
              //console.log('new line: ',newArray[i]);
            }
            //console.log('newArray:',newArray)
            if (response.data.tenderTransactions.pageInfo.hasNextPage) {
              const cost = response.extensions.cost.actualQueryCost;
              const estcost = response.extensions.cost.requestedQueryCost;
              const avail =
                response.extensions.cost.throttleStatus.currentlyAvailable;
              const rr = response.extensions.cost.throttleStatus.restoreRate;
              let waitTime = 1;
              if (cost > avail) {
                waitTime = ((cost - avail) / rr) * 1000;
              }
              const cursor = res[resultCount - 1].cursor;
              //console.log('cursor:',cursor)
              //let hasNextPage = response.data.tenderTransactions.pageInfo.hasNextPage
              return [newArray, cursor, waitTime];
            } else {
              return [newArray, "0", false];
            }
          }
        })
        .then((response) => {
          if (response[2]) {
            setAnotherPage(true);
            //console.log('partArray: ',partialTransactionArray.concat(response[0]))
            setPartialTransactionArray(
              partialTransactionArray.concat(response[0])
            );
            setTransactionCursor(response[1]);
            setTimeout(function () {
              //console.log('okay, done waiting.')
              setTriggerAnotherPage(triggerAnotherPage + 1);
            }, response[2]);
          } else {
            setAnotherPage(false);
            //console.log('last page has been loaded!')
            //console.log('partArray: ',partialTransactionArray.concat(response[0]))
            if (triggerAbort) {
              setWaiting(false);
              setTriggerAbort(false);
              //setStatusMessage('')
              setTransactionCursor("");
            } else {
              //setTransactionArray(partialTransactionArray.concat(response[0]));
              setPartialTransactionArray(
                partialTransactionArray.concat(response[0])
              );
              //setStatusMessage('')
              setTransactionCursor("");
              //setWaiting(false);
              setTriggerAnotherPOSPage(triggerAnotherPOSPage + 1);
            }
          }
        });
    } else if(startDateRegister && endDateRegister) {
      console.log('fetching POS transactions')
      setWaiting(true);
      setTriggerAnotherPOSPage(triggerAnotherPOSPage + 1);
    }
  }, [triggerAnotherPage]);

  useEffect(() => {
    //Get all POS transactions from today
    //console.log('tender count: ',tenderCount)
    console.log('POS Page Triggered', triggerAnotherPOSPage)
    if (triggerAbort) {
      console.log('aborting POS fetch')
      setWaiting(false);
      //setStatusMessage('')
      setTransactionCursor("");
      setTriggerAbort(false);
    } else if (waiting) {
      console.log('time to fetch...')
      //setWaiting(true);
      //console.log('end date: ', endDate, 'yesterday: ',todayDate,todaysDateValue);
      //is end date yesterday?
      if (!startDateRegister || !endDateRegister) {
        console.log('no start or end date')
        return;
      }
      console.log('fetching POS transactions')
      fetch(`/api/tender-transactions`, {
        method: "POST",
        body: JSON.stringify({
          startDate: startDateRegister,
          endDate: endDateRegister,
          num: resultCount,
          cursor: anotherPage ? transactionCursor : "",
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((response) => {
          if (response.errors) {
            //console.log(response.errors[0].message)
            let errWaitTime = 0;
            if (response.extensions && response.extensions.cost) {
              const errCost = response.extensions.cost.requestedQueryCost;
              const errAvail =
                response.extensions.cost.throttleStatus.currentlyAvailable;
              const errRr = response.extensions.cost.throttleStatus.restoreRate;
              if (errCost > errAvail) {
                errWaitTime = ((errCost - errAvail) / errRr) * 1000;
              }
            }
            const newEmptyArray = [];
            return [newEmptyArray, transactionCursor, errWaitTime];
          } else {
            //console.log('response:',response)
            const res = response.data.tenderTransactions.edges;
            //console.log('res:',res)
            const newArray: any[] = [];

            for (let i = 0; i < res.length; i++) {
              if (!res[i]?.node?.order) {
                continue;
              }
              const amt = res[i].node.amount.amount;
              const date = res[i].node.processedAt;
              const taxExempt =
                res[i].node.order.customer?.taxExempt ||
                res[i].node.order.taxExempt;
              const customer = res[i].node.order.customer;
              const tags = res[i].node.order.tags;
              let transFees = 0;
              const taxLines = res[i]?.node?.order?.taxLines || [];
              let taxTotal = 0;
              taxLines.map((line) => {
                taxTotal += Number(line.priceSet.shopMoney.amount);
              });
              let gateway = "Other";

              gateway =
                res[i].node.order.transactions.find(
                  (trans) => trans.amountSet.shopMoney.amount === amt
                )?.formattedGateway ||
                res[i].node.order.transactions.find(
                  (trans) => trans.amountSet.shopMoney.amount * 1 === amt * -1
                )?.formattedGateway ||
                "Other";

              if (gateway == "Other") {
                const refundTransactions = res[i].node.order.refunds?.find(
                  (refund) => {
                    //console.log('checking for refund transactions: ',refund.transactions)
                    Array.isArray(refund.transactions) &&
                    refund.transactions.some((transaction) => {
                      //console.log('does this transaction equal amt: ',transaction.amountSet.shopMoney.amount === amt,transaction.amoubtSet.shopMoney.amount,amt)
                      transaction.amountSet.shopMoney.amount === amt;
                    });
                  }
                );
                //console.log('refund transactions: ',refundTransactions)
                if (refundTransactions) {
                  gateway =
                    refundTransactions.transactions.find(
                      (transaction) =>
                        transaction.amountSet.shopMoney.amount === amt
                    )?.formattedGateway || "Other";
                }
              }

              let refundItems: any[] = [];

              //check for any refund items placed in the order metafields from the POS system
              const POSrefundItems: any[] = [];
              //console.log('testing these refund items',res[i].node.order.return_items)
              if (res[i].node.order.return_items?.value) {
                const refundItemsJSON = JSON.parse(
                  res[i].node.order.return_items.value
                );
                refundItemsJSON.forEach((item) => {
                  if (!processedLineItems.includes(item.node.id)) {
                    processedLineItems.push(item.node.id);
                    POSrefundItems.push(item);
                    //console.log('adding id to processed items: ',item.node.id)
                  }
                });
              }
              //console.log('refund items: ',POSrefundItems)
              console.log(
                "POS refund items: ",
                POSrefundItems,
                "for",
                res[i].node.order.return_items
              );

              //check for any refund transactions in the order metafields from the POS system
              const POSrefundTransactions: any[] = [];
              if (res[i].node.order.refund_transactions?.value) {
                const refundTransactionsJSON = JSON.parse(
                  res[i].node.order.refund_transactions.value
                );
                //console.log('refund transactions from POS found: ',refundTransactionsJSON)
                refundTransactionsJSON.forEach((refundTransaction) => {
                  if (!processedLineItems.includes(refundTransaction.id)) {
                    processedLineItems.push(refundTransaction.id);
                    POSrefundTransactions.push(refundTransaction);
                    //console.log('refund transactions from POS found: ',refundTransaction)
                  }
                });
              }
              const paydate = getPayoutDate(date);

              let lineItems: any = [];
              if (amt > 0) {
                lineItems = res[i].node?.order?.lineItems?.edges || [];
                lineItems = lineItems.filter((item) => {
                  //console.log("checking: ", item.node.id, processedLineItems);
                  if (processedLineItems.includes(item.node.id)) {
                    //console.log("already in set");
                    return false; // Do not include this item in the new array
                  } else {
                    //console.log("adding to set: ", item.node.id);
                    processedLineItems.push(item.node.id);
                    //console.log('adding item to list:',item.node.title)
                    if (item.node.title == "N/A") {
                      return false;
                    } else return true; // Include this item in the new array
                  }
                });

                if (gateway?.includes("Stripe")) {
                  //console.log('fees:',res[i].node.order.transactions)
                  transFees = parseFloat((amt * 0.029 + 0.3).toFixed(2));
                } else if (gateway?.includes("Manual")) {
                  transFees = parseFloat((amt * 0.029 + 0.3).toFixed(2));
                } else {
                  for (
                    let j = 0;
                    j < res[i]?.node?.order?.transactions?.length;
                    j++
                  ) {
                    if (
                      amt ===
                        res[i].node.order.transactions[j].amountSet.shopMoney
                          .amount &&
                      res[i].node.order.transactions[j].fees.length > 0
                    ) {
                      //console.log('fees:',res[i].node.order.transactions[j].fees)
                      transFees =
                        res[i].node.order.transactions[j].fees[0].amount.amount;
                    }
                  }
                }
              }
              if (amt < 0) {
                const refunds = res[i].node.order.refunds;
                //taxTotal = 0;
                //console.log('found a refund!',refunds)
                for (let jj = 0; jj < refunds.length; jj++) {
                  for (
                    let k = 0;
                    k < refunds[jj].transactions.edges.length;
                    k++
                  ) {
                    const transaction =
                      0 -
                      refunds[jj].transactions.edges[k].node.amountSet.shopMoney
                        .amount;
                    //console.log(`Does ${transaction} = ${amt}?`)
                    if (transaction == amt) {
                      refundItems = refunds[jj].refundLineItems.edges;
                      refundItems = refundItems.filter((item) => {
                        //console.log("checking: ", item.node.id,processedLineItems);
                        if (processedLineItems.includes(item.node.id)) {
                          //console.log('already in set')
                          return false; // Do not include this item in the new array
                        } else {
                          //console.log('adding to set: ',item.node.id)
                          processedLineItems.push(item.node.id);
                          return true; // Include this item in the new array
                        }
                      });

                      if (res[i].node.order.return_items?.value) {
                        const refundItemsJSON = JSON.parse(
                          res[i].node.order.return_items.value
                        );
                        refundItemsJSON.forEach((item) => {
                          item.node.id = item.node.id + 1;
                          item.node.quantity = item.node.quantity * -1;
                          if (!processedLineItems.includes(item.node.id)) {
                            processedLineItems.push(item.node.id);
                            POSrefundItems.push(item);
                            //console.log('adding id to processed items: ',item.node.id)
                          }
                        });
                      }

                      //console.log('yes!')
                    } else {
                      //console.log('no')
                    }
                  }
                }
                //console.log('refundItems:',refundItems)
              }
              //console.log('refundItems:',refundItems)
              if (gateway === "Manual") {
                gateway = "Stripe";
              }
              if (
                gateway !== "Stripe" &&
                gateway !== "Shopify Payments" &&
                gateway !== "Tab" &&
                gateway !== "Less Deposit"
              ) {
                newArray.push({
                  amount: res[i].node.amount.amount,
                  gateway: gateway,
                  items: lineItems,
                  refundItems: refundItems,
                  fees: transFees,
                  taxLines: taxLines,
                  taxTotal: Number(taxTotal.toFixed(2)),
                  date: date,
                  paydate: paydate,
                  source: "POS",
                  POSrefundItems: POSrefundItems,
                  taxExempt: taxExempt,
                  customer: customer,
                  tags: tags,
                });
                POSrefundTransactions.forEach((refund) => {
                  newArray.push({
                    amount: refund.amount,
                    gateway: refund.gateway,
                    fees: 0,
                    date: date,
                    taxTotal: 0,
                    paydate: paydate,
                    source: "POS",
                    taxExempt: taxExempt,
                    customer: customer,
                    tags: tags,
                  });
                });
              }
              //console.log('new line: ',newArray[i]);
            }
            //console.log('newArray:',newArray)
            if (response.data.tenderTransactions.pageInfo.hasNextPage) {
              const cost = response.extensions.cost.actualQueryCost;
              const estcost = response.extensions.cost.requestedQueryCost;
              const avail =
                response.extensions.cost.throttleStatus.currentlyAvailable;
              const rr = response.extensions.cost.throttleStatus.restoreRate;
              let waitTime = 1;
              if (cost > avail) {
                waitTime = ((cost - avail) / rr) * 1000;
              }
              const cursor = res[resultCount - 1].cursor;
              //console.log('cursor:',cursor)
              //let hasNextPage = response.data.tenderTransactions.pageInfo.hasNextPage
              return [newArray, cursor, waitTime];
            } else {
              return [newArray, "0", false];
            }
          }
        })
        .then((response) => {
          if (response[2]) {
            setAnotherPage(true);
            //console.log('partArray: ',partialTransactionArray.concat(response[0]))
            setPartialTransactionArray(
              partialTransactionArray.concat(response[0])
            );
            setTransactionCursor(response[1]);
            setTimeout(function () {
              setTriggerAnotherPOSPage(triggerAnotherPOSPage + 1);
            }, response[2]);
          } else {
            setAnotherPage(false);
            //console.log('last page has been loaded!')
            //console.log('partArray: ',partialTransactionArray.concat(response[0]))
            if (triggerAbort) {
              setWaiting(false);
              setTriggerAbort(false);
              //setStatusMessage('')
              setTransactionCursor("");
            } else {
              setTransactionArray(partialTransactionArray.concat(response[0]));
              //setStatusMessage('')
              setTransactionCursor("");
              setWaiting(false);
            }
          }
        });
    }
  }, [triggerAnotherPOSPage]);

  // Return the necessary data and functions
  return {
    transactionArray,
    waiting,
    setTriggerAbort,
    resetTransactionArray,
  };
}
