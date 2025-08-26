import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
} from "react";
import * as Types from "../components/POSWindow/POSTypes";
import { soundManager } from "../components/POSWindow/sounds/soundManager";
import noPhoto from "../components/POSWindow/no_photo.png";
import { toast } from "react-toastify";
//import { useUser } from "../App";

interface POSContextType {
  // Settings
  directoryHandle: FileSystemDirectoryHandle;
  isBFF: boolean;
  mode: "front" | "kitchen";

  // Search Results
  orderSearchResults: Types.Order[];
  setOrderSearchResults: (results: Types.Order[]) => void;

  // Order Items
  thisOrderItems: Types.ExtendedLineItem[];
  setThisOrderItems: (items: Types.ExtendedLineItem[]) => void;
  lineItems: Types.LineItem[];
  setLineItems: (items: Types.LineItem[]) => void;
  returnItems: Types.RefundLineItemNode[];
  setReturnItems: (items: Types.RefundLineItemNode[]) => void;
  kdsOrderItems: Types.KDSOrderItem[];
  setKdsOrderItems: (items: Types.KDSOrderItem[]) => void;

  printTicket: (kdsOrder: Types.KDSOrder) => void;

  // Customer
  customer: Types.Customer;
  setCustomer: (customer: Types.Customer) => void;
  address: Types.Address;
  setAddress: (address: Types.Address) => void;

  // Order Details
  orderId: number;
  setOrderId: (id: number) => void;
  orderNumber: number | null;
  setOrderNumber: (num: number | null) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;

  // Pricing and Discounts
  subtotalPrice: number;
  setSubtotalPrice: (price: number) => void;
  totalPrice: number;
  setTotalPrice: (price: number) => void;
  discountableSubtotal: number;
  setDiscountableSubtotal: (subtotal: number) => void;
  subtotalPreDiscount: number;
  setSubtotalPreDiscount: (subtotal: number) => void;
  totalDiscountAmount: number;
  setTotalDiscountAmount: (amount: number) => void;
  discountCodes: Types.DiscountCode[];
  setDiscountCodes: (codes: Types.DiscountCode[]) => void;
  discountApplications: any[];
  setDiscountApplications: (apps: any[]) => void;
  shopifyDiscountCodes: any[];
  setShopifyDiscountCodes: (codes: any[]) => void;

  // Tax
  taxExempt: boolean;
  setTaxExempt: (exempt: boolean) => void;
  taxLines: Types.TaxLine[];
  setTaxLines: (lines: Types.TaxLine[]) => void;
  totalTax: number;
  setTotalTax: (tax: number) => void;
  totalTaxAmount: number;
  setTotalTaxAmount: (amount: number) => void;

  // Transactions and Payments
  transactions: Types.Transaction[];
  setTransactions: (trans: Types.Transaction[]) => void;
  changeAmount: number;
  setChangeAmount: (amount: number) => void;

  // UI State
  typedValue: string;
  setTypedValue: (value: string) => void;
  isDelete: boolean;
  setIsDelete: (value: boolean) => void;
  currentTab: number;
  setCurrentTab: (tab: number) => void;
  triggerReset: number;
  setTriggerReset: (reset: number) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  emailReceipt: boolean;
  setEmailReceipt: (value: boolean) => void;

  // Members and Search
  members: Types.Member[];
  setMembers: (members: Types.Member[]) => void;
  suggestedCustomers: Types.Customer[];
  setSuggestedCustomers: (customers: Types.Customer[]) => void;
  employeeResults: any[];
  setEmployeeResults: (results: any[]) => void;

  // Fulfillment
  fulfilled: string | null;
  setFulfilled: (status: string | null) => void;
  fulfillments: Types.Fulfillment[];
  setFulfillments: (fuls: Types.Fulfillment[]) => void;
  fulOrders: Types.FulfillmentOrder[];
  setFulOrders: (orders: Types.FulfillmentOrder[]) => void;

  // Misc
  scannedItem: Types.ExtendedLineItem | null;
  setScannedItem: (item: Types.ExtendedLineItem | null) => void;
  refunds: Types.Refund[];
  setRefunds: (refunds: Types.Refund[]) => void;
  subs: Types.Subscription[];
  setSubs: (subs: Types.Subscription[]) => void;
  subId: number[] | string[] | null;
  setSubId: (id: number[] | string[] | null) => void;
  giftCards: Types.GiftCard[];
  setGiftCards: (cards: Types.GiftCard[]) => void;

  // Additional State
  loadingMessages: string[];
  setLoadingMessages: (messages: string[]) => void;
  fulfillmentOrderIds: any[];
  setFulfillmentOrderIds: (ids: any[]) => void;
  allFuls: Types.Fulfillment[];
  setAllFuls: (fuls: Types.Fulfillment[]) => void;
  isLoadingFulfillments: boolean;
  setIsLoadingFulfillments: (loading: boolean) => void;
  searchOrderIds: any[];
  setSearchOrderIds: (ids: any[]) => void;
  currentSearch: string | number | null;
  setCurrentSearch: (search: string | number | null) => void;
  reprintable: boolean;
  setReprintable: (reprintable: boolean) => void;
  attendanceCount: any;
  setAttendanceCount: (count: any) => void;
  calendarAttendance: any;
  setCalendarAttendance: (attendance: any) => void;
  refreshAttendance: number;
  setRefreshAttendance: (refresh: number) => void;
  submissionMessage: string;
  setSubmissionMessage: (message: string) => void;
  isOrderCancelled: boolean;
  setIsOrderCancelled: (cancelled: boolean) => void;

  // Functions
  clearOrder: (maintain?: boolean, openDrawer?: boolean) => Promise<void>;
  createOrder: (kdsItems?: Types.KDSOrderItem[]) => void;
  searchMembers: (term: string | number, force?: boolean) => void;
  setOrder: (order: Types.Order) => void;
  addNotesToOrder: () => void;
  updateOrder: () => void;
  cancelAllFuls: () => Promise<boolean>;
  fulfillAllOrders: (notify: boolean, printOrder: boolean) => void;
  fulfillWithOptions: (
    fulLineItems: {
      fulfillmentOrderId: string;
      fulfillmentOrderLineItems: { id: string; quantity: number }[];
    }[],
    notify?: boolean,
    printThisOrder?: boolean
  ) => void;
  undoFul: (itemId: number) => void;
  sanitizeLineItem: (item: Types.ExtendedLineItem) => Types.ExtendedLineItem;

  // Search
  searchByBarcode: (barcode: string) => void;
  searchBarcodes: (barcodes: string) => void;
  searchGCs: (searchTerm: string | number, force?: boolean) => void;
  searchOrders: (searchTerm: string | number) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  openDrawer: () => void;
  soundManager: typeof soundManager;
  inputRef: React.RefObject<HTMLInputElement>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function usePOS() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error("usePOS must be used within a POSProvider");
  }
  return context;
}

interface POSProviderProps {
  children: ReactNode;
  isBFF: boolean;
  directoryHandle: FileSystemDirectoryHandle;
  mode: "front" | "kitchen";
}

export function POSProvider({
  children,
  isBFF,
  directoryHandle,
  mode,
}: POSProviderProps) {
  // Search Results
  const [orderSearchResults, setOrderSearchResults] = useState<Types.Order[]>(
    []
  );

  //const { user } = useUser();

  // Order Items
  const [thisOrderItems, setThisOrderItems] = useState<
    Types.ExtendedLineItem[]
  >([]);
  const [lineItems, setLineItems] = useState<Types.LineItem[]>([]);
  const [returnItems, setReturnItems] = useState<Types.RefundLineItemNode[]>(
    []
  );
  const [kdsOrderItems, setKdsOrderItems] = useState<Types.KDSOrderItem[]>([]);

  // Customer
  const [customer, setCustomer] = useState<Types.Customer>({});
  const [address, setAddress] = useState<Types.Address>({});

  // Order Details
  const [orderId, setOrderId] = useState<number>(0);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [orderNotes, setOrderNotes] = useState<string>("");

  // Pricing and Discounts
  const [subtotalPrice, setSubtotalPrice] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [discountableSubtotal, setDiscountableSubtotal] = useState<number>(0);
  const [subtotalPreDiscount, setSubtotalPreDiscount] = useState<number>(0);
  const [totalDiscountAmount, setTotalDiscountAmount] = useState<number>(0);
  const [discountCodes, setDiscountCodes] = useState<Types.DiscountCode[]>([]);
  const [discountApplications, setDiscountApplications] = useState<any[]>([]);
  const [shopifyDiscountCodes, setShopifyDiscountCodes] = useState<any[]>([]);

  // Tax
  const [taxExempt, setTaxExempt] = useState<boolean>(false);
  const [taxLines, setTaxLines] = useState<Types.TaxLine[]>([]);
  const [totalTax, setTotalTax] = useState<number>(0);
  const [totalTaxAmount, setTotalTaxAmount] = useState<number>(0);

  // Transactions and Payments
  const [transactions, setTransactions] = useState<Types.Transaction[]>([]);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  // UI State
  const [typedValue, setTypedValue] = useState<string>("");
  const [isDelete, setIsDelete] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<number>(1);
  const [triggerReset, setTriggerReset] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [emailReceipt, setEmailReceipt] = useState<boolean>(false);

  // Members and Search
  const [members, setMembers] = useState<Types.Member[]>([]);
  const [suggestedCustomers, setSuggestedCustomers] = useState<
    Types.Customer[]
  >([]);
  const [employeeResults, setEmployeeResults] = useState<any[]>([]);

  // Fulfillment
  const [fulfilled, setFulfilled] = useState<string | null>(null);
  const [fulfillments, setFulfillments] = useState<Types.Fulfillment[]>([]);
  const [fulOrders, setFulOrders] = useState<Types.FulfillmentOrder[]>([]);

  // Misc
  const [scannedItem, setScannedItem] = useState<Types.ExtendedLineItem | null>(
    null
  );
  const [refunds, setRefunds] = useState<Types.Refund[]>([]);
  const [subs, setSubs] = useState<Types.Subscription[]>([]);
  const [subId, setSubId] = useState<number[] | string[] | null>([]);
  const [giftCards, setGiftCards] = useState<Types.GiftCard[]>([]);

  // Additional State
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [fulfillmentOrderIds, setFulfillmentOrderIds] = useState<any[]>([]);
  const [allFuls, setAllFuls] = useState<Types.Fulfillment[]>([]);
  const [isLoadingFulfillments, setIsLoadingFulfillments] = useState(false);
  const [searchOrderIds, setSearchOrderIds] = useState<any[]>([]);
  const [currentSearch, setCurrentSearch] = useState<string | number | null>(
    null
  );
  const [reprintable, setReprintable] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState({});
  const [calendarAttendance, setCalendarAttendance] = useState({});
  const [refreshAttendance, setRefreshAttendance] = useState(0);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [isOrderCancelled, setIsOrderCancelled] = useState(false);

  const inputRef = useRef(null);
  const drawerOpenedRef = useRef(false);

  useEffect(() => {
    let timer: string | number | NodeJS.Timeout;
    const handleEscKeyDown = (event: { key: string }) => {
      if (event.key === "Escape" && !drawerOpenedRef.current) {
        //console.log("start esc timer");
        timer = setTimeout(() => {
          if (drawerOpenedRef.current) return;
          openDrawer();
          drawerOpenedRef.current = true;
        }, 500);
      }
    };

    const handleEscKeyUp = (event: { key: string }) => {
      if (event.key === "Escape" && drawerOpenedRef.current) {
        clearTimeout(timer);
        setTimeout(() => {
          drawerOpenedRef.current = false; // Reset the flag when the key is released
          //console.log("closing drawer!");
        }, 1000);
      }
    };

    document.addEventListener("keydown", handleEscKeyDown);
    document.addEventListener("keyup", handleEscKeyUp);

    return () => {
      document.removeEventListener("keydown", handleEscKeyDown);
      document.removeEventListener("keyup", handleEscKeyUp);
    };
  }, []);

  useEffect(() => {
    fetch("/api/get-attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        date: new Date(new Date().getTime() - 6 * 3600000)
          .toISOString()
          .slice(0, 10),
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

        const attCounts = {};

        attendenceObjects.forEach((attend) => {
          if (!attend.cancelled) {
            const thisCategory = attend.category;
            attCounts[thisCategory] =
              (attCounts[thisCategory] || 0) + Number(attend.quantity);
          }
        });

        setAttendanceCount(attCounts);
        // Handle success - e.g., update UI or state
        fetch("/api/get-calendar-attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            date: new Date(new Date().getTime() - 6 * 3600000)
              .toISOString()
              .slice(0, 10),
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            //console.log('calendar attendance data:', data);

            const attendenceObjects: AttendanceObject[] = data;

            const attCounts = {};

            attendenceObjects.forEach((attend) => {
              if (!attend.cancelled) {
                const thisCategory = attend.category;
                attCounts[thisCategory] =
                  (attCounts[thisCategory] || 0) + Number(attend.quantity);
              }
            });

            setCalendarAttendance(attCounts);
            // Handle success - e.g., update UI or state
          })
          .catch((error) => {
            // Handle error - e.g., show error message to user
          });
      })
      .catch((error) => {
        // Handle error - e.g., show error message to user
      });
  }, [refreshAttendance, triggerReset, orderId]);

  useEffect(() => {
    setIsLoadingFulfillments(true);
    fetch(`/api/get-fulfillment-orders/${orderId}`, {
      method: "GET",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const ids = data.fulfillment_orders.reduce(
          (acc: any[], order: { status: string; id: any }) => {
            if (order.status === "open" || order.status === "in_progress") {
              // Replace with the appropriate condition
              acc.push(order.id);
            }
            return acc;
          },
          []
        );
        setFulfillmentOrderIds(ids);
        setFulOrders(data.fulfillment_orders);
        setIsLoadingFulfillments(false);
      })
      .catch((error) => {
        //toast.error("Error retrieving fulfillment orders:" + error);
        setIsLoadingFulfillments(false);
      });
  }, [orderId]); // Function to retrieve all fulfillment orders for a given order ID

  useEffect(() => {
    function isMobileDevice() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    }

    const handleClick = (event: MouseEvent) => {
      //("click!");
      if (
        (event.target as HTMLElement).tagName !== "INPUT" &&
        inputRef.current &&
        document.contains(inputRef.current) &&
        !(event.target as HTMLElement).closest(".paymentModal") // Check if the click was not within an element with the class "paymentModal"
      ) {
        inputRef.current.focus();
      }
    };

    if (!isMobileDevice()) {
      document.addEventListener("click", handleClick);
    }

    // Cleanup the event listener when the component unmounts
    return () => {
      if (!isMobileDevice()) {
        document.removeEventListener("click", handleClick);
      }
    };
  }, []); //continuously sets the input to the search bar when not inputting elsewhere

  useEffect(() => {
    //updates the line items with the discount allocations from Shopify's order and applies negative quantity items
    if (orderId) {
      // For online orders, we have discount_allocations directly on the line items.
      const updatedItems = JSON.parse(
        JSON.stringify(thisOrderItems)
      ) as Types.ExtendedLineItem[];
      // Apply any line item discounts that come from Shopify's order
      updatedItems.forEach((item) => {
        if (item.discount_allocations && item.discount_allocations.length > 0) {
          item.discount_allocations.forEach((da) => {
            const discountAmount = parseFloat(da.amount);
            // Ensure properties array exists
            if (discountAmount > 0) {
              if (!item.properties) {
                item.properties = [];
              }
              // Add a property to show the discount on the UI
              item.properties.push({
                name: `Discount`,
                value: `-$${discountAmount.toFixed(2)}`,
                addPrice: `-${discountAmount}`,
              });

              // Reduce the item's price by the allocated discount amount.
              // Note: discount_allocations amount is total discount for this line item, not per unit.
              // We'll divide by quantity to reduce per unit price consistently.
              const perUnitDiscount = discountAmount / item.quantity;
              item.price = Number((item.price - perUnitDiscount).toFixed(2));
            }
          });
        }
      });

      setLineItems(updatedItems);
    } else {
      let subtotalCalc = 0;
      let totalTaxCalc = 0;
      //let totalDiscountValue = 0;

      const lineItemsCopy: Types.ExtendedLineItem[] = JSON.parse(
        JSON.stringify(thisOrderItems)
      );
      const shippingDiscountCodes = discountCodes.filter(
        (discount) => discount.type === "shipping"
      );
      const itemDiscountCodes = discountCodes.filter(
        (discount) => discount.type !== "shipping"
      );

      let subtotalPreDiscount = thisOrderItems.reduce((acc, item) => {
        if (!item.no_discounts) {
          return acc + item.fullPrice * item.quantity;
        } else {
          return acc;
        }
      }, 0);

      // Prepare totals on discount codes
      for (const discount of itemDiscountCodes) {
        discount.totalAmount = discount.amount;
      }

      const rebuiltLineItems: Types.ExtendedLineItem[] = [];

      // Handle negative line items by applying discount modifiers on positive line items
      const negativeItems = lineItemsCopy.filter((item) => item.quantity < 0);

      const positiveItems = lineItemsCopy.filter((item) => item.quantity > 0);

      const thisReturnItems: Types.RefundLineItemNode[] = [];

      for (const negItem of negativeItems) {
        // Calculate total discount value from the negative item (absolute value)
        let remainingNegativeValue = Math.abs(negItem.price * negItem.quantity);

        // Allocate this discount across the positive items
        for (const posItem of positiveItems) {
          if (remainingNegativeValue <= 0) break;

          // Ensure the positive item has a properties array for modifiers
          if (!posItem.properties) {
            posItem.properties = [];
          }

          // Calculate the total value of this positive item (price * quantity)
          const posItemTotalValue = posItem.price * posItem.quantity;

          if (posItemTotalValue >= remainingNegativeValue) {
            // Only a partial discount applies to this item:
            // Calculate the per unit discount to apply
            const perUnitReduction = remainingNegativeValue / posItem.quantity;

            // Record the partial discount as a modifier
            posItem.properties.push({
              name: "RETURN",
              value: `${negItem.quantity * -1} ${negItem.title} @ $${
                negItem.price
              }`,
              addPrice: `-${
                (negItem.quantity * -1 * negItem.price) / posItem.quantity
              }`,
            });

            // Reduce the item's price by the calculated per unit discount
            posItem.price = Number(
              (posItem.price - perUnitReduction).toFixed(2)
            );
            // All of the negative discount has now been allocated
            remainingNegativeValue = 0;
          }
        }

        if (remainingNegativeValue > 0) {
          const newNegItem = { ...negItem };
          newNegItem.price = -remainingNegativeValue / newNegItem.quantity;
          positiveItems.push(newNegItem);
        }

        // Preserve return item logic
        thisReturnItems.push({
          node: {
            id: Math.random(),
            quantity: Math.abs(negItem.quantity),
            lineItem: {
              title: negItem.title,
              vendor: negItem.vendor,
              price: negItem.price,
              quantity: Math.abs(negItem.quantity),
            },
            priceSet: {
              shopMoney: {
                amount: negItem.price,
              },
            },
          },
        });
      }

      setReturnItems(thisReturnItems);

      // Process each line item once, applying all discounts before deciding to split
      for (const originalItem of positiveItems) {
        if (originalItem.no_discounts) {
          // If no discounts apply, just push the item as-is
          rebuiltLineItems.push(originalItem);
          continue;
        }

        // Apply all discounts (percentage and fixed) to determine final price adjustments
        const item = { ...originalItem };
        if (!item.properties) {
          item.properties = [];
        }

        // Track total percentage discount amount and total fixed discount in cents
        let totalPercentageDiscount = 0;
        let totalFixedDiscountCents = 0;
        let code = null;

        for (const discount of itemDiscountCodes) {
          if (discount.type === "percentage" && discount.amount !== undefined) {
            let discountValue = discount.amount;
            if (discount.categories) {
              for (const category of discount.categories) {
                if (item.vendor === category.category || item.category === category.category) {
                  discountValue = category.discount;
                }
              }
            }
            const thisDiscountAmount = (item.price * discountValue) / 100;
            totalPercentageDiscount += thisDiscountAmount;
          } else if (discount.type === "fixed_amount" && discount.amount) {
            // Calculate this item's share of the discount in cents
            const itemFullPriceTotal = item.fullPrice * item.quantity;
            const itemShareOfDiscount =
              (itemFullPriceTotal / subtotalPreDiscount) * discount.totalAmount;
            const thisDiscountCents = Math.round(itemShareOfDiscount * 100);

            // Reduce the discount's pool after allocation
            subtotalPreDiscount -= item.price * item.quantity;
            discount.totalAmount -= itemShareOfDiscount;

            totalFixedDiscountCents += thisDiscountCents;
          }
        }

        // First, apply the percentage discount to the item's price
        if (totalPercentageDiscount > 0) {
          // Add property for percentage discount
          item.properties.push({
            name: "discount",
            value: `${((totalPercentageDiscount / item.price) * 100).toFixed(
              0
            )}% OFF`,
            addPrice: `-${totalPercentageDiscount}`,
          });
          // Apply percentage discount
          item.price = Number(
            (item.price - totalPercentageDiscount).toFixed(2)
          );
          //totalDiscountValue += totalPercentageDiscount * item.quantity;
        }

        // Next, handle the fixed amount discount if any
        if (totalFixedDiscountCents > 0) {
          // Divide fixed discount among items
          const quantity = item.quantity;
          const baseDiscountPerItemCents = Math.floor(
            totalFixedDiscountCents / quantity
          );
          const remainder = totalFixedDiscountCents % quantity;

          const baseDiscountPerItem = baseDiscountPerItemCents / 100;
          const plusOneCount = remainder; // how many items get an extra cent

          // If no remainder, just apply the base discount to the whole item
          if (plusOneCount === 0) {
            // One line item, all get the same discount
            const discountedItem = {
              ...item,
              price: Number((item.price - baseDiscountPerItem).toFixed(2)),
              properties: [
                ...item.properties,
                {
                  name: "discount",
                  value: `$${baseDiscountPerItem.toFixed(2)} Off Each`,
                  addPrice: `-${baseDiscountPerItem}`,
                },
              ],
            };
            rebuiltLineItems.push(discountedItem);
            //totalDiscountValue += baseDiscountPerItem * quantity;
          } else {
            // We need to split the item into two parts: base and plusOne
            const baseCount = quantity - plusOneCount;
            const plusOneDiscount = (baseDiscountPerItemCents + 1) / 100;

            if (baseCount > 0) {
              const baseItem = {
                ...item,
                quantity: baseCount,
                price: Number((item.price - baseDiscountPerItem).toFixed(2)),
                properties: [
                  ...item.properties,
                  {
                    name: "discount",
                    value: `$${baseDiscountPerItem.toFixed(2)} Off Each`,
                    addPrice: `-${baseDiscountPerItem}`,
                  },
                ],
              };
              rebuiltLineItems.push(baseItem);
              //totalDiscountValue += baseDiscountPerItem * baseCount;
            }

            const remainderItem = {
              ...item,
              quantity: plusOneCount,
              price: Number((item.price - plusOneDiscount).toFixed(2)),
              properties: [
                ...item.properties,
                {
                  name: "discount",
                  value: `$${plusOneDiscount.toFixed(2)} Off Each`,
                  addPrice: `-${plusOneDiscount}`,
                },
              ],
            };
            rebuiltLineItems.push(remainderItem);
            //totalDiscountValue += plusOneDiscount * plusOneCount;
          }
        } else {
          // No fixed amount discount, no need to split, just push the (possibly percentage-discounted) item
          rebuiltLineItems.push(item);
        }
      }
      //console.log("rebuiltLineItems: ", rebuiltLineItems);
      // Now recalculate subtotal & tax after applying all discounts and potential splits
      for (const item of rebuiltLineItems) {
        subtotalCalc += Number(item.price.toFixed(2)) * item.quantity;
        if (item.taxable && !taxExempt) {
          item.tax_lines = [];
          const itemTaxLine =
            Number((item.price * item.quantity * 1.0825).toFixed(2)) -
            Number(item.price.toFixed(2)) * item.quantity;
          item.tax_lines.push({
            title: "Sales Tax",
            rate: 0.0825,
            price: itemTaxLine,
          });
          totalTaxCalc += itemTaxLine;
        }
      }

      // Apply shipping discounts if needed
      for (const discount of shippingDiscountCodes) {
        // Fill in logic here if needed
      }

      const roundedSubtotal = toTwoDecimalPlaces(subtotalCalc);
      const roundedTax = toTwoDecimalPlaces(totalTaxCalc);
      const roundedTotal = toTwoDecimalPlaces(roundedSubtotal + roundedTax);

      setSubtotalPrice(roundedSubtotal);
      setTotalTaxAmount(roundedTax);
      setTaxLines([{ price: roundedTax, title: "Sales Tax", rate: 0.0825 }]);
      setTotalPrice(roundedTotal);
      setLineItems(rebuiltLineItems);

      // Build KDS order items from lineItems that are flagged for KDSw
      const kdsItems: Types.KDSOrderItem[] = rebuiltLineItems
        .filter((item) => item.kds_enabled && item.quantity > 0)
        .flatMap((item) => {
          const properties = item.properties || [];
          const baseItem = {
            item_name: item.title,
            quantity: item.quantity,
            prepared_quantity:
              item.category.includes("drinks") ||
              item.category.includes("merchandise")
                ? item.quantity
                : 0,
            fulfilled_quantity:
              item.category.includes("drinks") ||
              item.category.includes("merchandise")
                ? item.quantity
                : 0,
            station: item.kds_station || "pickup", // e.g., "grill", "pickup", etc.
            special_instructions:
              properties && properties.length > 0
                ? properties
                    .filter(
                      (p) =>
                        p.kds_enabled === true && p.kds_fulfillable === false
                    )
                    .map((p) => p.value)
                    .join(", ")
                : null,
          };
          const fulfillableProperties = properties.filter(
            (p) => p.kds_enabled === true && p.kds_fulfillable === true
          );
          if (fulfillableProperties.length > 0) {
            return [
              baseItem,
              ...fulfillableProperties.map((p) => ({
                item_name: p.value,
                quantity: item.quantity,
                station: p.kds_station || "pickup", // e.g., "grill", "pickup", etc.
                special_instructions: null,
                prepared_quantity:
                  p.category.includes("drinks") ||
                  p.category.includes("merchandise")
                    ? item.quantity
                    : 0,
                fulfilled_quantity:
                  p.category.includes("drinks") ||
                  p.category.includes("merchandise")
                    ? item.quantity
                    : 0,
              })),
            ];
          } else {
            return [baseItem];
          }
        });

      setKdsOrderItems(kdsItems);

      //setTotalDiscountAmount(toTwoDecimalPlaces(totalDiscountValue));
      // setShopifyDiscountCodes(orderDiscountCodes);
    } // end else block
  }, [thisOrderItems, discountApplications, discountCodes, taxExempt]);

  function toTwoDecimalPlaces(num) {
    return Math.round(num * 100) / 100;
  }

  // Functions
  const openDrawer = () => {
    //console.log("opening drawer!");
    if (window.electronAPI) {
      soundManager.play("pop4");
      window.electronAPI.openDrawer();
    }
  };

  const printTicket = (kdsOrder: Types.KDSOrder) => {
    if (window.electronAPI) {
      window.electronAPI.printTicket(kdsOrder);
    }
  };

  const clearOrder = (maintainButtons = false, open = true) => {
    setIsSubmitting(true);
    const promises: Promise<void>[] = [];
    promises.push(
      new Promise<void>((resolve) => {
        setEmailReceipt(false);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setSubmissionMessage("Clearing Order...");
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setTypedValue("");
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setOrderSearchResults([]);
        resolve();
      })
    );
    //promises.push(
    //  new Promise<void>((resolve) => {
    //    setMembers([]);
    //    resolve();
    //  })
    //);

    if (open) openDrawer();
    //console.log("clearing...");
    soundManager.play("pop4");

    promises.push(
      new Promise<void>((resolve) => {
        setChangeAmount(0);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setOrderNumber(null);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setRefunds([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setReprintable(false);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setCurrentSearch(null);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setThisOrderItems([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setCustomer({});
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setAddress({});
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setOrderId(0);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setTaxExempt(false);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setTransactions([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setTaxLines([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setFulfillmentOrderIds([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setFulOrders([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setAllFuls([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setSearchOrderIds([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setSubId([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setFulfilled(null);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setDiscountApplications([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setSuggestedCustomers([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setDiscountCodes([]);
        resolve();
      })
    );
    promises.push(
      new Promise<void>((resolve) => {
        setShopifyDiscountCodes([]);
        resolve();
      })
    );

    if (maintainButtons != true) {
      promises.push(
        new Promise<void>((resolve) => {
          setMembers([]);
          resolve();
        })
      );
      promises.push(
        new Promise<void>((resolve) => {
          setSubs([]);
          resolve();
        })
      );
      promises.push(
        new Promise<void>((resolve) => {
          setOrderSearchResults([]);
          resolve();
        })
      );
      promises.push(
        new Promise<void>((resolve) => {
          setGiftCards([]);
          resolve();
        })
      );
    }

    return Promise.all(promises).then(() => {
      setTriggerReset((prev) => prev + 1);
      setTotalTax(0);
      setTotalTaxAmount(0);
      setOrderNotes("");
      setIsOrderCancelled(false);
      setIsSubmitting(false);
    });
  };

  const searchOrders = (searchTerm: string | number) => {
    setTypedValue("");
    // if the search term is a string and contains 'id=123' then strip that url param out and change the searchTerm to 123, also break it by ? and & for the params
    if (typeof searchTerm === "string" && searchTerm.includes("id=")) {
      const urlParams = new URLSearchParams(searchTerm);
      searchTerm = urlParams.get("id");
    }

    const isOrderId = false;

    //if (!maintain) clearOrder();
    const searchOrderIdDirectly = (searchTerm: string | number) => {
      addLoadingMessage(`Searching for order(s)`);
      return fetch(`/api/search-order/${searchTerm}`, {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((response: { orders: Types.Order[] }) => {
          removeLoadingMessage(`Searching for order(s)`);
          // Explicitly type the response
          if (response.orders) {
            return response.orders;
          } else {
            throw new Error("Order not found");
          }
        });
    };

    const performSearch = () => {
      if (isOrderId) {
        return searchOrderIdDirectly(searchTerm).then((order) => order);
      } else {
        return fetch(`/api/order-id-search/`, {
          method: "POST",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            term: searchTerm,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            const edges = data?.data?.orders?.edges;
            if (edges && edges.length > 0) {
              const orders = edges.map((edge: { node: any }) => edge.node);
              const orderIds = orders
                .slice(0, 100)
                .map(
                  (order: { id: string }) => order.id.split("/").slice(-1)[0]
                );
              return searchOrderIdDirectly(orderIds.join(","));
            } else {
              throw new Error("No orders found");
            }
          });
      }
    };

    performSearch()
      .then((orders: Types.Order[]) => {
        setOrderSearchResults([...orders]);
        const matchedOrder = orders.find(
          (order) =>
            order.id === Number(searchTerm) ||
            order.order_number === Number(searchTerm)
        );
        if (matchedOrder && (orderId || thisOrderItems.length === 0)) {
          setOrder(matchedOrder);
        }
      })
      .catch((error) => {
        //toast.error("Error searching orders:" + error);
      });
  };

  const createMember = async (memberData: any) => {
    try {
      const response = await fetch("/api/create-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(memberData), // convert the member data to JSON
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newMember = await response.json();
      //console.log("Member created:", newMember);
      // You can do something with the new member data, like updating state or UI
    } catch (error) {
      toast.error("Error creating member:" + error);
    }

    // Example usage:
    // createMember({
    //   name: "John Doe",
    //   membership_type: "Premium",
    //   dob: "1990-01-01",
    //   sub_id: 12345,
    //   photo: "base64EncodedStringOfPhoto", // assuming the photo is base64 encoded
    //   barcode: 67890
    // });
  };

  const createOrder = (
    kdsItems: Types.KDSOrderItem[] = kdsOrderItems
  ): void => {
    console.log("kds order items: ", kdsItems);
    if (isSubmitting) {
      return; // Prevent multiple submissions
    }
    setIsSubmitting(true);
    setSubmissionMessage("Creating Order...");

    soundManager.play("chaching");
    let shopifyOrderItems = lineItems.filter(
      (item) =>
        !item.function ||
        (item.function !== "addMember" && item.function !== "editMember")
    );

    if (shopifyOrderItems.length == 0) {
      clearOrder(false, false);
      return;
    }

    const shopifyDisountCodes: Types.DiscountCode[] = [...shopifyDiscountCodes];
    const shopifySubtotal = Number(subtotalPreDiscount.toFixed(2));
    let discAmount = 0;

    const processInventoryAdjustments = async (shopifyOrderItems) => {
      for (const item of shopifyOrderItems) {
        if (item.quantity <= 0) {
          // Identify refund items and adjust inventory
          if (item.variant_id) {
            // Prepare the adjustment request
            const adjustmentBody = {
              variantId: item.variant_id,
              adjustment: Math.abs(item.quantity), // Since the quantity is negative, use absolute value
            };

            try {
              // Wait for API response before continuing
              const response = await fetch("/api/adjust-inventory", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
                body: JSON.stringify(adjustmentBody),
              });

              const data = await response.json();
              //console.log("Inventory adjusted for refund:", data);
            } catch (error) {
              toast.error("Error adjusting inventory:" + error);
            }

            // Wait 1500ms before making the next request to avoid rate limits
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
      }

      return;
    };

    // Call the function properly
    processInventoryAdjustments(shopifyOrderItems);

    //console.log("shopify discount codes: ", shopifyDiscountCodes);

    shopifyOrderItems = shopifyOrderItems.filter((item) => item.quantity > 0);

    //combine disount array into a single discount. add the amounts and combine the code strings
    const totalDiscount: Types.DiscountCode = {
      type: "fixed_amount",
      amount: 0,
      code: "",
    };
    //console.log("total Discount: ", totalDiscount);
    //console.log("total discount amount", totalDiscountAmount);
    //console.log("shopifyDisountCodes", shopifyDisountCodes);

    const refundTransactions: Types.Transaction[] = [];
    //console.log("shopify discount codes: ", shopifyDisountCodes);
    if (totalPrice > 0) {
      shopifyDisountCodes.forEach((discount) => {
        //console.log("shop discount: ", discount);
        if (totalDiscount.code !== "") {
          totalDiscount.code += " & ";
        }
        if (discount.type == "fixed_amount") {
          totalDiscount.code += discount.code;
        } else if (discount.type == "percentage") {
          totalDiscount.code += discount.code;
        }
        // console.log("total discount after", discount, totalDiscount);
      });
      totalDiscount.amount += totalDiscountAmount;
      totalDiscount.amount += discAmount;
      //console.log("totalDiscount", totalDiscount);
    } else {
      transactions.forEach((transaction) => {
        if (transaction.amount <= 0) {
          refundTransactions.push({ ...transaction, id: Math.random() });
        }
      });
      totalDiscount.code = "Refund";
    }

    //console.log("positiveTransactions", transactions);

    let positiveTransactions = [...transactions];

    positiveTransactions = positiveTransactions.filter(
      (transaction) => transaction.amount > 0
    );

    if (positiveTransactions.length == 0) {
      positiveTransactions.push(
        {
          amount: 0.01,
          kind: "sale",
          gateway: "na",
        },
        {
          amount: 0.01,
          kind: "change",
          gateway: "na",
        }
      );
    }
    /*
    //filter out any "Tab" transactions
    positiveTransactions = positiveTransactions.filter(
      (transaction) => transaction.gateway !== "Tab"
    );
*/

    //const positiveTaxLines = taxLines.filter((taxLine) => taxLine.price > 0);

    const sanitizedLineItems = shopifyOrderItems.map(sanitizeLineItem);
    if (sanitizedLineItems.length == 0) {
      sanitizedLineItems.push({
        quantity: 1,
        price: 0,
        title: "N/A",
        requires_shipping: false,
      });
    }

    //console.log('creating attendance object')
    const attendanceObjects = [];
    lineItems.forEach((item) => {
      if (item.attendance_category) {
        const attCat = item.attendance_category.split("*")[0];
        const attMult = Number(item.attendance_category.split("*")[1] || 1);
        attendanceObjects.push({
          category: attCat,
          quantity: item.quantity * attMult,
          date: new Date(new Date().getTime() - 6 * 3600000).toLocaleDateString(
            "en-US",
            { timeZone: "America/Chicago" }
          ),
        });
      }
    });

    //console.log('attendanceObjects', attendanceObjects);

    const calendarObjects = [];
    lineItems.forEach((item) => {
      if (item.calendar_category) {
        const calCat = item.calendar_category.split("*")[0];
        const calMult = Number(item.calendar_category.split("*")[1] || 1);
        calendarObjects.push({
          category: calCat,
          quantity: item.quantity * calMult,
          date: new Date(new Date().getTime() - 6 * 3600000).toLocaleDateString(
            "en-US",
            { timeZone: "America/Chicago" }
          ),
        });
      }
    });

    //console.log("total discoutn", totalDiscount);

    const orderBody: Types.Order = {
      line_items: sanitizedLineItems,
      tax_exempt: taxExempt,
      transactions: positiveTransactions,
      total_price: Math.max(totalPrice, 0),
      subtotal_price: Math.max(Number(shopifySubtotal.toFixed(2)), 0),
      //tax_lines: positiveTaxLines,
      total_tax: Math.max(Number(totalTaxAmount.toFixed(2)), 0),
      discount_codes: [totalDiscount.amount > 0 ? totalDiscount : null],
      fulfillment_status: "fulfilled",
      inventory_behaviour: "decrement_ignoring_policy",
      send_receipt: emailReceipt,
      metafields: [
        {
          type: "json",
          namespace: "zdtpos",
          key: "return_items",
          value: JSON.stringify(returnItems),
        },
        {
          type: "json",
          namespace: "zdtpos",
          key: "refund_transactions",
          value: JSON.stringify(refundTransactions),
        },
        {
          type: "json",
          namespace: "zdtpos",
          key: "attendanceObjects",
          value: JSON.stringify(attendanceObjects),
        },
        {
          type: "json",
          namespace: "zdtpos",
          key: "calendarObjects",
          value: JSON.stringify(calendarObjects),
        },
      ],
      note: orderNotes,
      //test: true
    };
    //console.log("Order Body:", orderBody);

    // Conditionally include customer if it's not an empty object
    if (Object.keys(customer).length > 0) {
      orderBody.customer = customer;
    }

    // Conditionally include billing_address if it's not an empty object
    if (Object.keys(address).length > 0) {
      orderBody.billing_address = address;
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      orderBody.email = customer.email;
    }


    setSubmissionMessage("Submitting Order...");

    
    let isCash = false;
    transactions.forEach((transaction) => {
      if (transaction.gateway == "Cash") {
        isCash = true;
      }
    });
    const gcItems = lineItems.filter(
      (item) => item.function === "redeemGC"
    );
    const wristbandItems = lineItems.filter(
      (item) => item.function === "wristband"
    );

    if (isCash || gcItems.length > 0 || wristbandItems.length > 0) {
      openDrawer();
    }

    fetch(`/api/create-order`, {
      // Adjusted endpoint to create order
      method: "POST",
      body: JSON.stringify(orderBody),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.order) {
          const addMemberItems = lineItems.filter(
            (item) => item.function === "addMember"
          );
          const editMemberItems = lineItems.filter(
            (item) => item.function === "editMember"
          );
          const checkInItems = lineItems.filter(
            (item) => item.function === "checkIn"
          );

          const GCUWItems = lineItems.filter((item) =>
            item.function?.includes("activateGC_UW")
          );
          const GCEAP_Items = lineItems.filter((item) =>
            item.function?.includes("activateGC_EAP")
          );
          addMemberItems.forEach((item) => {
            const addMemberProperties = { membership_type: item.title };
            item.properties.forEach((property) => {
              addMemberProperties[property.name] = property.value;
            });
            //console.log("Creating member with properties:", addMemberProperties);

            // Construct the body of the request
            const requestBody = JSON.stringify(addMemberProperties);

            // Fetch request to create a new member via the API
            fetch("/api/create-member", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
              body: requestBody,
            })
              .then((response) => response.json())
              .then((data) => {
                //console.log("Member created:", data);
                // Handle success - e.g., update UI or state
              })
              .catch((error) => {
                toast.error("Error creating member:" + error);
                // Handle error - e.g., show error message to user
              });
          });
          editMemberItems.forEach((item) => {
            const editMemberProperties = {};
            item.properties.forEach((property) => {
              editMemberProperties[property.name] = property.value;
            });
            //console.log("editing member with properties:", editMemberProperties);

            // Construct the body of the request
            const requestBody = JSON.stringify(editMemberProperties);

            // Fetch request to create a new member via the API
            fetch("/api/edit-member", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
              body: requestBody,
            })
              .then((response) => response.json())
              .then((data) => {
                //console.log("Member edited:", data);
                // Handle success - e.g., update UI or state
              })
              .catch((error) => {
                toast.error("Error editing member:" + error);
                // Handle error - e.g., show error message to user
              });
          });
          checkInItems.forEach((item) => {
            const editMemberProperties = {
              visit_timestamp: new Date().toLocaleString(),
            };
            item.properties.forEach((property) => {
              editMemberProperties[property.name] = property.value;
            });
            //console.log("checking in member...", editMemberProperties);
            // Construct the body of the request
            const requestBody = JSON.stringify(editMemberProperties);

            // Fetch request to create a new member via the API
            fetch("/api/checkin", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
              body: requestBody,
            })
              .then((response) => response.json())
              .then((data) => {
                //console.log("Member edited:", data);
                // Handle success - e.g., update UI or state
              })
              .catch((error) => {
                toast.error("Error editing member:" + error);
                // Handle error - e.g., show error message to user
              });
          });
          gcItems.forEach((item) => {
            const timestamp = new Date().toLocaleString();
            //console.log("redeeming GC...");
            const requestObject = {
              timestamp: timestamp,
              card_id: item.barcode,
            };
            const requestBody = JSON.stringify(requestObject);
            // Fetch request to create a new member via the API
            fetch("/api/redeem-gift-card", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
              body: requestBody,
            })
              .then((response) => response.json())
              .then((data) => {
                //console.log("GC Redeemed", data);
                // Handle success - e.g., update UI or state
              })
              .catch((error) => {
                toast.error("Error redeeming GC:" + error);
                // Handle error - e.g., show error message to user
              });
          });
          GCUWItems.forEach((item) => {
            const gcProperties = { items: "Unlimited Wristband" };
            item.properties.forEach((property) => {
              gcProperties[property.name] = property.value;
            });
            const requestBody = JSON.stringify(gcProperties);
            // Fetch request to create a new member via the API
            fetch("/api/activate-gift-card", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
              body: requestBody,
            })
              .then((response) => response.json())
              .then((data) => {
                //console.log("GC Activated", data);
                // Handle success - e.g., update UI or state
              })
              .catch((error) => {
                toast.error("Error Activating GC:" + error);
                // Handle error - e.g., show error message to user
              });
          });
          GCEAP_Items.forEach((item) => {
            const gcProperties = {
              items: "Unlimited Wristband, Combo Meal Wristband",
            };
            item.properties.forEach((property) => {
              gcProperties[property.name] = property.value;
            });
            const requestBody = JSON.stringify(gcProperties);
            // Fetch request to create a new member via the API
            fetch("/api/activate-gift-card", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
              body: requestBody,
            })
              .then((response) => response.json())
              .then((data) => {
                //console.log("GC Activated", data);
                // Handle success - e.g., update UI or state
              })
              .catch((error) => {
                toast.error("Error Activating GC:" + error);
                // Handle error - e.g., show error message to user
              });
          });
          // Store credit adjustments
          const storeCreditTransactions = transactions.filter(
            (tx) => tx.gateway === "Store Credit" && tx.kind === "sale"
          );

          storeCreditTransactions.forEach((transaction) => {
            const adjustmentAmount = transaction.amount; // Negative for used store credit

            fetch(
              `/api/customers/${encodeURIComponent(
                customer.store_credit.id
              )}/store-credit`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                  amount: adjustmentAmount,
                  currencyCode: "USD",
                  type: "debit", // Adjust the credit
                }),
              }
            )
              .then((res) => res.json())
              .then((data) => {
                //console.log("Store credit adjusted:", data);
              })
              .catch((error) => {
                toast.error("Error adjusting store credit:" + error);
              });
          });

          thisOrderItems.forEach((item) => {
            setSubmissionMessage("Adding Attendance...");

            if (item.attendance_category) {
              const attCat = item.attendance_category.split("*")[0];
              const attMult = Number(
                item.attendance_category.split("*")[1] || 1
              );
              const attendanceObject = {
                category: attCat,
                quantity: item.quantity * attMult,
                order_number: response.order.order_number,
                date: response.order.processed_at,
              };
              fetch("/api/add-attendance", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
                body: JSON.stringify(attendanceObject),
              })
                .then((response) => response.json())
                .then((data) => {
                  setRefreshAttendance((prev) => prev + 1);
                  // Handle success - e.g., update UI or state
                })
                .catch((error) => {
                  // Handle error - e.g., show error message to user
                });
            }

            if (item.calendar_category) {
              const calCat = item.calendar_category.split("*")[0];
              const calMult = Number(item.calendar_category.split("*")[1] || 1);
              const calendarObject = {
                category: calCat,
                quantity: item.quantity * calMult,
                order_number: response.order.order_number,
                date: response.order.processed_at,
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
                  // Handle success - e.g., update UI or state
                })
                .catch((error) => {
                  // Handle error - e.g., show error message to user
                  setSubmissionMessage("Error adding calendar attendance");
                  //console.log("Error:", error);
                });
            }
          });

          if (window.electronAPI) {
            setSubmissionMessage("Printing Receipt...");
            if (
              Number(totalPrice) != 0 &&
              !customer?.tags?.includes("employee")
            ) {
              setReprintable(true);
              window.electronAPI.printOrder(
                lineItems,
                transactions,
                response.order.order_number,
                response.order.id,
                Number(totalTaxAmount),
                shopifyDiscountCodes,
                Number(subtotalPrice),
                Number(totalPrice),
                customer
              );
            }
            //clearOrder();
            /* upgrade wristband to a membership (disabled temporarily)
            // Find the average price of all items in the order that are "Unlimited Wristband"s
            const foundItems = lineItems.filter((item) =>
              item.title?.includes("Unlimited Wristband")
            );
            const sum = foundItems.reduce((sum, item) => sum + item.price, 0);
            const averagePrice = sum / foundItems.length;
            const foundItem = { price: averagePrice };
            if (foundItem) {
              setSubmissionMessage("Creating upgrade discount...");
              fetch(`/api/create-membership-discount`, {
                method: "POST",
                body: JSON.stringify({
                  discountAmount: Math.round(foundItem.price * 100) / 100,
                  discountCode: response.order.order_number,
                }),
                headers: {
                  "Content-type": "application/json; charset=UTF-8",
                  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
              })
                .then((res) => res.json())
                .then((discountResponse) => {
                  // console.log("Discount created:", discountResponse);
                })
                .catch((error) => {
                  toast.error("Error creating discount:" + error);
                });
            }
            */
          }
          setOrder(response.order,true);
          setDiscountCodes([]);
          setMembers([]);
          setSubs([]);
          setGiftCards([]);
          setOrderSearchResults([]);
          //set tab to 1
          setCurrentTab(1);
          //console.log("set order: ", response.order);
          const allFulfilled = kdsItems.every(
            (item) => item.fulfilled_quantity > 0
          );
          if (kdsItems.length > 0) {
            // Build payload for the KDS order matching our kitchen_orders table
            const name =
              (customer?.first_name || "") +
              (customer?.last_name ? " " + customer.last_name : "");

            const kdsPayload: Types.KDSOrder = {
              pos_order_id: response.order.id, // POS order ID
              order_number: response.order.order_number,
              status: allFulfilled ? "fulfilled" : "pending",
              items: kdsItems,
              name: name || null,
            };

            // Send the KDS order payload to the backend.
            fetch("/api/kds-order", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
              body: JSON.stringify(kdsPayload),
            })
              .then((res) => res.json())
              .then((kdsResponse) => {
                //console.log("KDS Order Created:", kdsResponse);
              })
              .catch((error) => {
                toast.error("Error creating KDS order:" + error);
              });
          }
        } else {
          //alert(JSON.stringify(response.errors)); // Adjusted error handling
          setSubmissionMessage(
            "Error with order." +
              JSON.stringify(response.errors) +
              "\n" +
              JSON.stringify(response)
          );
          //setIsSubmitting(false);
        }
      });
  }; //creates an order

  const sanitizeLineItem = (item: Types.ExtendedLineItem) => {
    const allowedProperties = {
      id: true,
      admin_graphql_api_id: true,
      fulfillable_quantity: true,
      fulfillment_service: true,
      fulfillment_status: true,
      gift_card: true,
      grams: true,
      name: true,
      price: true,
      product_exists: true,
      product_id: true,
      properties: true,
      quantity: true,
      requires_shipping: true,
      sku: true,
      taxable: true,
      title: true,
      total_discount: true,
      variant_id: true,
      variant_inventory_management: true,
      variant_title: true,
      vendor: true,
      tax_lines: true,
      duties: true,
      discount_allocations: true,
      price_set: {
        shop_money: {
          amount: true,
          currency_code: true,
        },
        presentment_money: {
          amount: true,
          currency_code: true,
        },
      },
      total_discount_set: {
        shop_money: {
          amount: true,
          currency_code: true,
        },
        presentment_money: {
          amount: true,
          currency_code: true,
        },
      },
    };

    const sanitizedItem = {} as Types.ExtendedLineItem;

    for (const prop in item) {
      if (Object.prototype.hasOwnProperty.call(allowedProperties, prop)) {
        if (
          typeof allowedProperties[prop] === "object" &&
          !Array.isArray(allowedProperties[prop])
        ) {
          sanitizedItem[prop] = sanitizeLineItem(item[prop]);
        } else {
          sanitizedItem[prop] = item[prop];
        }
      }
    }

    if (sanitizedItem.properties) {
      const keyCounts: { [key: string]: number } = {};
      for (const attr of sanitizedItem.properties) {
        if (keyCounts[attr.name]) {
          keyCounts[attr.name]++;
          attr.name = `${attr.name}-${keyCounts[attr.name]}`;
        } else {
          keyCounts[attr.name] = 1;
        }
      }
    }

    if (sanitizedItem.taxable === undefined) sanitizedItem.taxable = true;
    if (sanitizedItem.requires_shipping === undefined)
      sanitizedItem.requires_shipping = false;

    return sanitizedItem;
  };

  const undoFul = (itemId: number) => {
    setIsSubmitting(true);
    setSubmissionMessage("Cancelling Fulfillment...");
    const revFuls = [...allFuls].reverse();

    const ful = revFuls.find((ful) => {
      return ful.line_items.some((item) => {
        return item.id == itemId;
      });
    });

    if (ful?.id) {
      fetch(`/api/cancel-fulfill`, {
        method: "POST",
        body: JSON.stringify({
          fulId: `gid://shopify/Fulfillment/${ful.id}`,
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((res) => {
          const unlimitedCount = ful.line_items.reduce((count, item) => {
            if (
              item.title.includes("Unlimited Wristband") &&
              item.quantity > 0
            ) {
              return count - item.quantity;
            } else if (item.title.includes("Fun Pack") && item.quantity > 0) {
              return count - item.quantity * 4;
            }
            return count;
          }, 0);

          //console.log('undo ful unlimited count: ', unlimitedCount);

          if (unlimitedCount < 0) {
            const attendanceObject = {
              category: "Online",
              quantity: unlimitedCount,
              order_number: orderNumber,
              date: new Date(new Date().getTime() - 6 * 3600000)
                .toISOString()
                .slice(0, 10),
            };
            fetch("/api/add-attendance", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
              body: JSON.stringify(attendanceObject),
            })
              .then((response) => response.json())
              .then((data) => {
                setRefreshAttendance((prev) => prev + 1);
                // Handle success - e.g., update UI or state
              })
              .catch((error) => {
                // Handle error - e.g., show error message to user
              });
          }

          updateOrder();
          clearOrder(false, false);
        })
        .catch((error) =>
          toast.error("Error undoing fulfillment:" + error.message)
        );
    }
  };

  const cancelAllFuls = async () => {
    setIsSubmitting(true);
    setSubmissionMessage("Cancelling Fulfillments...");
    let allFulsCompleted = false;
    await Promise.all(
      allFuls.map(async (ful) => {
        try {
          await fetch(`/api/cancel-fulfill`, {
            method: "POST",
            body: JSON.stringify({
              fulId: `gid://shopify/Fulfillment/${ful.id}`,
            }),
            headers: {
              "Content-type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          });
        } catch (error) {
          toast.error("Error cancelling fulfillment:" + error.message);
        }
      })
    );
    allFulsCompleted = true;
    return allFulsCompleted;
  };

  const addNotesToOrder = () => {
    if (!orderNotes || !orderId) return;
    fetch("/api/order-note", {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        orderId: orderId,
        note: orderNotes,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        updateOrder();
      })
      .catch((error) => toast.error("Error adding notes to order:" + error));
  };

  const updateOrder = () => {
    setSubmissionMessage("Updating order...");
    setTriggerReset(Math.random());
    setRefreshAttendance((prev) => prev + 1);

    const searchOrderIdDirectly = (searchTerm: number) => {
      return fetch(`/api/search-order/${searchTerm}`, {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((response: { orders: Types.Order[] }) => {
          if (response.orders) {
            setIsSubmitting(false);
            return response.orders;
          } else {
            throw new Error("Order not found");
          }
        });
    };

    if (orderId) {
      searchOrderIdDirectly(orderId)
        .then((orders) => {
          if (orders && orders.length > 0) {
            setOrder(orders[0]);
          }
        })
        .catch((error) => {
          //toast.error("Error searching for order:" + error);
        });
    }
  };

  const setOrder = (order: Types.Order, justSubmitted?: boolean) => {
    setIsSubmitting(true);
    setSubmissionMessage("Setting Order on POS...");
    try {
      if (order.id || order.order_number) {
        const params = new URLSearchParams();
        if (order.id) params.append("orderNumbers", String(order.id));
        if (order.order_number)
          params.append("orderNumbers", String(order.order_number));

        // Hit the backend endpoint to search for gift cards associated with the order.
        fetch(`/api/giftcards/order?${params.toString()}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        })
          .then((response) => response.json())
          .then((giftCards) => {
            // Log gift cards if any results are returned.
            if (giftCards && giftCards.length > 0) {
              const hasNonGiftCard = order.line_items.some(
                (item) => !item.name.includes("Gift Card")
              );
              if (!hasNonGiftCard) {
                clearOrder();
              }
              setGiftCards(giftCards);
              setCurrentTab(9);
              return;
            }
          })
          .catch((error) => {
            //toast.error("Error fetching gift cards:" + error);
          });
      }

      // Trigger a UI update/reset
      setTriggerReset((prev) => prev + 1);

      // Set refunds if available
      order.refunds && setRefunds(order.refunds);

      // Use the current_total_tax for refunded orders so that refunded tax doesn't display.
      // For non-refunded orders, use the original total_tax.
      if (
        order.financial_status === "refunded" &&
        order.current_total_tax !== undefined
      ) {
        // For a refunded order the current_total_tax is zero, reflecting that tax is refunded.
        setTotalTaxAmount(Number(order.current_total_tax));
      } else if (order.total_tax) {
        setTotalTaxAmount(Number(order.total_tax));
      }

      // Set the order id and order number
      order.id && setOrderId(order.id);
      order.order_number && setOrderNumber(order.order_number);

      // Set transactions; if not provided, construct a default sale transaction.
      if (order.transactions) {
        setTransactions(
          order.transactions
            .filter(
              (transaction) =>
                transaction.kind !== "authorization" &&
                transaction.kind !== "void"
            )
            .map((transaction) => ({
              ...transaction,
              kind: transaction.kind === "capture" ? "sale" : transaction.kind,
              amount: Number(transaction.amount),
              gateway: transaction.gateway
                .replace(/_([a-z])/g, (_, g1) => ` ${g1.toUpperCase()}`)
                .replace(/\b\w/g, (l) => l.toUpperCase()),
            }))
        );
      } else if(!justSubmitted) {
        console.log('no order transactions, setting Paid',order)
        setTransactions([
          {
            amount:
              (order.current_total_price || 0) - (order.total_outstanding || 0),
            kind: "sale",
            status: "success",
            gateway: "Paid",
          },
        ]);
      }

      // Set fulfillment status and items
      setFulfilled(order.fulfillment_status || null);
      order.line_items && setThisOrderItems(order.line_items);

      // Set customer and billing address if present
      //order.customer && setCustomer(order.customer);
      //order.billing_address && setAddress(order.billing_address);

      // Clear the typed value input
      setTypedValue("");

      // Set the subtotal and total price from the order
      order.current_subtotal_price &&
        setSubtotalPrice(order.current_subtotal_price);
      order.current_total_price && setTotalPrice(order.current_total_price);

      // Set the tax lines from the order
      order.tax_lines && setTaxLines(order.tax_lines);

      // Set fulfillments if any
      order.fulfillments && setAllFuls(order.fulfillments);

      // Parse any tags that might be used for member lookup
      if (order.tags) {
        const apidtag = order.tags
          .split(",")
          .filter((tag) => tag.includes("apid:"));
        const apids = apidtag.map((apid) => apid.split("apid:")[1]);
        const apid = apids[0] || null;
        setSubId(apids);
        if (apid) {
          searchMembers(apid, false, true);
        }
      }

      // Set any discount codes
      order.discount_codes && setShopifyDiscountCodes(order.discount_codes);

      // Set order notes if any
      setOrderNotes(order.note);

      // Mark the order as cancelled if applicable
      order.cancelled_at && setIsOrderCancelled(true);
    } catch (error) {
      toast.error("Error in setOrder:" + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const searchMembers = (
    searchTerm: string | number,
    force = false,
    apid = false
  ) => {
    if (searchTerm == currentSearch && force != true) return;
    setCurrentSearch(searchTerm);
    //setSearchHistory((prev) => [searchTerm, ...prev]);
    setTypedValue("");
    //console.log("searching members for: ", searchTerm);
    const isBarcode =
      typeof searchTerm === "number" ||
      (typeof searchTerm === "string" && /^\d+$/.test(searchTerm));

    const isEmail =
      typeof searchTerm === "string" && /^\S+@\S+\.\S+$/.test(searchTerm);

    const findAndDisplayFile = async (
      directoryHandle,
      fileName
    ): Promise<string | null> => {
      //console.log("looking for : ", `${directoryHandle}/${fileName}`);
      try {
        if (window.electronAPI) {
          // Electron environment: Use the Electron method to read the file as a Data URL.
          // Assuming `directoryHandle` in Electron context is actually the directory path
          const filePath = `${directoryHandle}/${fileName}`; // This path construction might need adjustment based on your actual directory path handling
          return await window.electronAPI.readFileAsDataURL(filePath);
        } else if ("showDirectoryPicker" in window) {
          // Web environment: Use the File System Access API.
          //console.log("web looking for : ", `${directoryHandle}/${fileName}`);
          const fileHandle = await directoryHandle.getFileHandle(fileName, {
            create: false,
          });
          if (fileHandle) {
            const file = await fileHandle.getFile();
            return URL.createObjectURL(file);
          }
        } else {
          //toast.error("Your environment does not support file system access");
        }
      } catch (error) {
        //toast.error("Error accessing file:" + error);
      }
      return null;
    };

    const fetchMemberPhotos = async (members) => {
      const updatedMembers = await Promise.all(
        members.map(async (member) => {
          const membershipNumberPadded = member.membership_number
            .toString()
            .padStart(6, "0");
          const photoFileName = `${membershipNumberPadded}.jpg`;

          try {
            let photoDataUrl = noPhoto; // Default to a no-photo placeholder

            //console.log("directoryHandle:", props.directoryHandle);
            const localPhotoUrl = await findAndDisplayFile(
              directoryHandle,
              photoFileName
            );
            //console.log("localPhotoUrl:", photoFileName);
            if (localPhotoUrl) {
              //console.log("Found local photo:", photoFileName);
              photoDataUrl = localPhotoUrl; // Use local photo if found
            } else {
              // Fetch from API if not found locally
              const photoUrl = `/api/get-member-photo?membership_number=${membershipNumberPadded}`;
              const response = await fetch(photoUrl, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
              });

              if (response.ok) {
                const blob = await response.blob();
                photoDataUrl = URL.createObjectURL(blob);
              }
            }

            return { ...member, photo: photoDataUrl };
          } catch (error) {
            //toast.error("Error fetching member photo:" + error);
            return { ...member, photo: noPhoto };
          }
        })
      );
      return updatedMembers;
    };

    const fetchAllMemberVisits = async (members) => {
      const membershipNumbers = members
        .map((member) => member.membership_number)
        .join(",");
      if (membershipNumbers.length == 0) return members;
      try {
        const visitsResponse = await fetch(
          `/api/get-visits?membership_numbers=${membershipNumbers}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        const visitsData = await visitsResponse.json();
        // Process and attach visits to their respective members
        const membersWithVisits = members.map((member) => ({
          ...member,
          visits_array: visitsData
            .filter(
              (visit) => visit.membership_number === member.membership_number
            )
            .map((visit) => visit.visit_timestamp), // Extract only the timestamp from each visit
        }));

        return membersWithVisits;
      } catch (error) {
        //toast.error("Error fetching member visits:" + error);
        return members.map((member) => ({ ...member, visits: [] })); // Assume no visits if there's an error
      }
    };

    const fetchSubscriptions = async (members) => {
      const uniqueSubIds = new Set(
        members.map((member) => member.sub_id).filter((subId) => subId)
      );
      if (subId?.length > 0) {
        subId.forEach((sub) => {
          uniqueSubIds.add(sub);
        });
      }
      const subscriptions = [];
      if (members.length > 0) {
        setCurrentTab(7);
      } else {
        setCurrentTab(6);
      }
      const loadingMsg = "Loading membership subscription details...";
      for (const subsId of uniqueSubIds) {
        try {
          addLoadingMessage(loadingMsg);
          const res = await fetch(`/api/get-subscription-details/${subsId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          });
          const data = await res.json();
          if (data.payload) {
            subscriptions.push(data.payload);
          } else {
            //toast.error("Payload missing for subscription ID:" + subsId);
          }
          removeLoadingMessage(loadingMsg);

          //setCurrentTab(7)
        } catch (error) {
          //toast.error("Error fetching subscription details:" + error);
          removeLoadingMessage(loadingMsg);
        }
      }
      if (subs != subscriptions) {
        setSubs(subscriptions); // Assuming setSubs is your state update function for subs
      }
    };

    const searchMemberships = async (queryParam, queryValue) => {
      const encodedValue = encodeURIComponent(queryValue);
      const loadingMsg = "Loading membership details and photos...";
      try {
        addLoadingMessage(loadingMsg);
        const detailedMembershipsResponse = await fetch(
          `/api/memberships-details?${queryParam}=${encodedValue}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        const detailedMembershipsData =
          await detailedMembershipsResponse.json();
        setSubs([]);
        setMembers(detailedMembershipsData || [null]);
        fetchSubscriptions(detailedMembershipsData);
        fetchAllMemberVisits(detailedMembershipsData);

        //fetch photos
        const membersWithPhotos = await fetchMemberPhotos(
          detailedMembershipsData
        );
        const membersWithVisits = await fetchAllMemberVisits(membersWithPhotos); // Fetch and attach visits
        removeLoadingMessage(loadingMsg);
        setMembers(membersWithVisits);
      } catch (err) {
        removeLoadingMessage(loadingMsg);
        //toast.error("Error:", err);
      }
    };
    if (isBarcode) {
      searchMemberships("barcode", searchTerm);
    } else if (isEmail) {
      //console.log("searching email", searchTerm);
      searchMemberships("email", searchTerm);
    } else {
      searchMemberships("name", searchTerm);
    }
  };

  const fulfillAllOrders = (notify = true, printThisOrder = true) => {
    if (isSubmitting) {
      return; // Prevent multiple submissions
    }
    setIsSubmitting(true);
    setSubmissionMessage("Fulfilling Order...");
    const unlimitedCount = thisOrderItems.reduce((count, item) => {
      if (
        item.title.includes("Unlimited Wristband") &&
        item.fulfillable_quantity > 0
      ) {
        return count + item.fulfillable_quantity;
      } else if (
        item.title.includes("Fun Pack") &&
        item.fulfillable_quantity > 0
      ) {
        return count + item.fulfillable_quantity * 4;
      }
      return count;
    }, 0);

    // console.log('unlimited count: ', unlimitedCount);

    if (unlimitedCount > 0) {
      setSubmissionMessage("Adding up attendance changes...");
      const attendanceObject = {
        category: "Online",
        quantity: unlimitedCount,
        order_number: orderNumber,
        date: new Date(new Date().getTime() - 6 * 3600000)
          .toISOString()
          .slice(0, 10),
      };
      fetch("/api/add-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(attendanceObject),
      })
        .then((response) => response.json())
        .then((data) => {
          setRefreshAttendance((prev) => prev + 1);
          // Handle success - e.g., update UI or state
        })
        .catch((error) => {
          toast.error("Error adding attendance:" + error);
        });
    }

    setSubmissionMessage("Fulfilling All Items...");
    fetch(`/api/fulfillv2`, {
      method: "POST",
      body: JSON.stringify({
        input: {
          lineItems: fulfillmentOrderIds.map((id) => {
            return {
              fulfillmentOrderId: `gid://shopify/FulfillmentOrder/${id}`,
            };
          }),
          notify: notify,
        },
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        /* upgrade wristband to a membership (disabled temporarily)
        setSubmissionMessage("Checking upgrade options...");
        // Find the average price of all items in the order that are "Unlimited Wristband"s
        const foundItems = lineItems.filter((item) =>
          item.title?.includes("Unlimited Wristband")
        );
        const sum = foundItems.reduce((sum, item) => sum + item.price, 0);
        const averagePrice = sum / foundItems.length;
        const foundItem = { price: averagePrice };
        if (foundItem) {
          setSubmissionMessage("Creating upgrade discount...");
          fetch(`/api/create-membership-discount`, {
            method: "POST",
            body: JSON.stringify({
              discountAmount: foundItem.price,
              discountCode: orderNumber.toString(),
            }),
            headers: {
              "Content-type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          })
            .then((res) => res.json())
            .then((discountResponse) => {
              //console.log("Discount created:", discountResponse);
            })
            .catch((error) => {
              toast.error("Error creating discount:" + error);
            });
        }
        */
        if (window.electronAPI) {
          setReprintable(true);
          if (printThisOrder) {
            setSubmissionMessage("Printing receipt...");
            window.electronAPI.printOrder(
              lineItems,
              transactions,
              orderNumber,
              orderId,
              Number(totalTaxAmount),
              shopifyDiscountCodes,
              Number(subtotalPrice),
              Number(totalPrice),
              customer
            );
          }
        }
        // Handle success (e.g., show a success message)
        clearOrder(false, false);
        updateOrder();
        setCurrentTab(1);
      })
      .catch((error) => {
        toast.error("Error fulfilling orders:" + error);
        setSubmissionMessage(
          "An error occurred during fulfillment. Please cancel and try again." +
            error
        );
        // Handle error (e.g., show an error message)
      });
  };

  function fulfillWithOptions(
    fulLineItems: {
      fulfillmentOrderId: string;
      fulfillmentOrderLineItems: {
        id: string;
        quantity: number;
      }[];
    }[],
    notify = true,
    printThisOrder = true
  ) {
    setIsSubmitting(true);
    setSubmissionMessage("Fulfilling Items...");
    const items = [];

    thisOrderItems.forEach((item) => {
      //console.log('checking item: ', item)
      //for each of the fulLineItems, look at the id, find the line_item_id, and see if it matches this item.id
      fulLineItems.forEach((fulLineItem) => {
        fulLineItem.fulfillmentOrderLineItems.forEach((fulOrderLineItem) => {
          const thisId = Number(fulOrderLineItem.id.split("/").pop());
          fulOrders.forEach((fulOrder) => {
            fulOrder.line_items.forEach((lineItem) => {
              if (lineItem.id === thisId && lineItem.line_item_id === item.id) {
                const itemToAdd = {
                  title: item.title,
                  quantity: fulOrderLineItem.quantity,
                };
                items.push(itemToAdd);
              }
            });
          });
        });
      });
    });

    const unlimitedCount = items.reduce((count, item) => {
      if (item.title.includes("Unlimited Wristband") && item.quantity > 0) {
        return count + item.quantity;
      } else if (item.title.includes("Fun Pack") && item.quantity > 0) {
        return count + item.quantity * 4;
      }
      return count;
    }, 0);

    if (unlimitedCount > 0) {
      setSubmissionMessage("Adding attendance...");
      const attendanceObject = {
        category: "Online",
        quantity: unlimitedCount,
        order_number: orderNumber,
        date: new Date(new Date().getTime() - 6 * 3600000)
          .toISOString()
          .slice(0, 10),
      };
      fetch("/api/add-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(attendanceObject),
      })
        .then((response) => response.json())
        .then((data) => {
          setRefreshAttendance((prev) => prev + 1);
          // Handle success - e.g., update UI or state
        })
        .catch((error) => {
          // Handle error - e.g., show error message to user
        });
    }

    setSubmissionMessage("Fulfilling items...");
    fetch(`/api/fulfillv2`, {
      method: "POST",
      body: JSON.stringify({
        input: {
          lineItems: fulLineItems,
          notify: notify,
        },
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        /*upgrade wristband to a membership (disabled temporarily)
        // Find the average price of all items in the order that are "Unlimited Wristband"s
        const foundItems = lineItems.filter((item) =>
          item.title?.includes("Unlimited Wristband")
        );
        const sum = foundItems.reduce((sum, item) => sum + item.price, 0);
        const averagePrice = sum / foundItems.length;
        const foundItem = { price: averagePrice };
        if (foundItem) {
          setSubmissionMessage("Creating discount...");
          fetch(`/api/create-membership-discount`, {
            method: "POST",
            body: JSON.stringify({
              discountAmount: foundItem.price,
              discountCode: orderNumber.toString(),
            }),
            headers: {
              "Content-type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          })
            .then((res) => res.json())
            .then((discountResponse) => {
              //console.log("Discount created:", discountResponse);
            })
            .catch((error) => {
              toast.error("Error creating discount:" + error);
            });
        }
        */
        if (window.electronAPI) {
          setReprintable(true);
          if (printThisOrder) {
            setSubmissionMessage("Printing Receipt...");

            window.electronAPI.printOrder(
              lineItems,
              transactions,
              orderNumber,
              orderId,
              Number(totalTaxAmount),
              shopifyDiscountCodes,
              Number(subtotalPrice),
              Number(totalPrice),
              customer
            );
          }
        }
        // Handle success (e.g., show a success message)
        clearOrder(false, false);
        updateOrder();
      })
      .catch((error) => {
        toast.error("Error fulfilling orders:" + error);
        setSubmissionMessage("Error Fulfiling Orders. Cancel and try again...");
        // Handle error (e.g., show an error message)
      });
  }

  const searchByBarcode = async (barcode: string | number) => {
    //console.log("searching by barcode");
    try {
      const response = await fetch(`/api/search-by-barcode/${barcode}`, {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data) {
        setScannedItem({ ...data, isMod: false, modClass: null });
        setTypedValue("");
        return true; // Indicate that an item was found and added
      }
    } catch (error) {
      //toast.error("Error searching item by barcode:" + error);
    }
    return false; // Indicate no item was found
  };

  const searchBarcodes = (barcode: string) => {
    //console.log("searching by barcode 2", barcode);
    return new Promise((resolve) => {
      searchByBarcode(barcode).then((found) => {
        if (found) {
          setTypedValue("");
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  };

  const searchGCs = (searchTerm: string | number, force = false) => {
    return new Promise((resolve) => {
      if (searchTerm == currentSearch && force != true) {
        resolve(false);
        return;
      }

      const isBarcode =
        typeof searchTerm === "number" ||
        (typeof searchTerm === "string" && /^\d+$/.test(searchTerm));

      if (isBarcode) {
        fetch(`/api/search-gift-cards?card_number=${searchTerm}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        })
          .then((gcResponse) => gcResponse.json())
          .then((gcData: Types.GiftCard[]) => {
            //console.log("gcData", gcData);

            let foundValidGC = false;

            for (const gc of gcData) {
              if (
                !gc.redeem_timestamp &&
                (!gc.expiration || new Date(gc.expiration) >= new Date()) &&
                (!gc.valid_starting ||
                  new Date(gc.valid_starting) <= new Date())
              ) {
                //console.log("found valid gc:", gc);

                const existingGC = lineItems.find(
                  (item) => item.barcode === gc.card_id
                );

                if (!existingGC) {
                  //console.log("gc not found in lineitems");

                  const newItem = {
                    title: gc.items + " Gift Card",
                    price: 0,
                    quantity: 1,
                    max_quantity: 1,
                    barcode: gc.card_id,
                    properties: [
                      ...(gc.expiration
                        ? [
                            {
                              name: "Expiration",
                              value: new Date(
                                gc.expiration
                              ).toLocaleDateString(),
                            },
                          ]
                        : []),
                      {
                        name: "Card Number",
                        value: gc.card_number.toString(),
                      },
                      ...(gc.issued_to
                        ? [
                            {
                              name: "Issued To",
                              value: gc.issued_to.toString(),
                            },
                          ]
                        : []),
                    ],
                    function: "redeemGC",
                    attendance_category: "Gift Card",
                  };

                  if (orderId) {
                    clearOrder(true, false);
                    setThisOrderItems([newItem]);
                  } else {
                    setThisOrderItems((prev) => [...prev, newItem]);
                  }

                  foundValidGC = true;
                  break; // Stop once we find and redeem a valid gift card
                }
              }
            }
            setGiftCards(gcData);
            if (foundValidGC) {
              resolve(true);
            } else if (gcData.length > 0) {
              resolve(true);
              setCurrentTab(9);
            } else {
              resolve(false);
            }
          })
          .catch((error) => {
            //toast.error("Error fetching gift cards:" + error);
            resolve(false);
          });
      } else {
        resolve(false);
      }
    });
  };

  const addLoadingMessage = (message: string) => {
    setLoadingMessages((prevMessages) => [...prevMessages, message]);
  };

  const removeLoadingMessage = (message: string) => {
    setLoadingMessages((prevMessages) =>
      prevMessages.filter((msg) => msg !== message)
    );
  };

  const handleKeyDown = (event: {
    key: string;
    code: string;
    preventDefault: () => void;
  }) => {
    console.log("keydown: ", event.key);
    if (isDelete && (event.key === "Delete" || event.key === "Backspace")) {
      event.preventDefault(); // Prevent the backspace key from functioning
    }
    if (
      event.code === "NumpadAdd" ||
      event.code === "NumpadSubtract" ||
      event.code === "NumpadMultiply"
    ) {
      console.log("ignore!");
      event.preventDefault(); // Prevent the backspace key from functioning
    }
    if (event.key === "Enter" && typedValue) {
      //console.log("enter pressed");
      const searchValue = typedValue + "";
      setTypedValue("");
      searchGCs(searchValue).then((foundGC) => {
        if (!foundGC) {
          searchBarcodes(searchValue).then((foundBarcode) => {
            if (!foundBarcode) {
              //console.log("no GCs or barcodes found");
              searchMembers(searchValue);
              searchOrders(searchValue);
            }
          });
        } else {
          setTypedValue("");
        }
      });
    }
  };

  const value = {
    directoryHandle,
    isBFF,
    // Order Items
    thisOrderItems,
    setThisOrderItems,
    lineItems,
    setLineItems,
    returnItems,
    setReturnItems,
    kdsOrderItems,
    setKdsOrderItems,
    printTicket,

    // Customer
    customer,
    setCustomer,
    address,
    setAddress,

    // Order Details
    orderId,
    setOrderId,
    orderNumber,
    setOrderNumber,
    orderNotes,
    setOrderNotes,

    // Pricing and Discounts
    subtotalPrice,
    setSubtotalPrice,
    totalPrice,
    setTotalPrice,
    discountableSubtotal,
    setDiscountableSubtotal,
    subtotalPreDiscount,
    setSubtotalPreDiscount,
    totalDiscountAmount,
    setTotalDiscountAmount,
    discountCodes,
    setDiscountCodes,
    discountApplications,
    setDiscountApplications,
    shopifyDiscountCodes,
    setShopifyDiscountCodes,

    // Tax
    taxExempt,
    setTaxExempt,
    taxLines,
    setTaxLines,
    totalTax,
    setTotalTax,
    totalTaxAmount,
    setTotalTaxAmount,

    // Transactions and Payments
    transactions,
    setTransactions,
    changeAmount,
    setChangeAmount,

    // UI State
    typedValue,
    setTypedValue,
    isDelete,
    setIsDelete,
    currentTab,
    setCurrentTab,
    triggerReset,
    setTriggerReset,
    isSubmitting,
    setIsSubmitting,
    emailReceipt,
    setEmailReceipt,

    // Members and Search
    members,
    setMembers,
    suggestedCustomers,
    setSuggestedCustomers,
    employeeResults,
    setEmployeeResults,
    orderSearchResults,
    setOrderSearchResults,

    // Fulfillment
    fulfilled,
    setFulfilled,
    fulfillments,
    setFulfillments,
    fulOrders,
    setFulOrders,

    // Misc
    scannedItem,
    setScannedItem,
    refunds,
    setRefunds,
    subs,
    setSubs,
    subId,
    setSubId,
    giftCards,
    setGiftCards,
    searchByBarcode,
    searchBarcodes,
    searchGCs,
    searchOrders,
    handleKeyDown,

    // Additional State
    loadingMessages,
    setLoadingMessages,
    fulfillmentOrderIds,
    setFulfillmentOrderIds,
    allFuls,
    setAllFuls,
    isLoadingFulfillments,
    setIsLoadingFulfillments,
    searchOrderIds,
    setSearchOrderIds,
    currentSearch,
    setCurrentSearch,
    reprintable,
    setReprintable,
    attendanceCount,
    setAttendanceCount,
    calendarAttendance,
    setCalendarAttendance,
    refreshAttendance,
    setRefreshAttendance,
    submissionMessage,
    setSubmissionMessage,
    isOrderCancelled,
    setIsOrderCancelled,

    // Functions
    clearOrder,
    createOrder,
    searchMembers,
    setOrder,
    addNotesToOrder,
    updateOrder,
    cancelAllFuls,
    fulfillAllOrders,
    fulfillWithOptions,
    undoFul,
    sanitizeLineItem,
    openDrawer,
    soundManager,
    inputRef,
    mode,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
}
