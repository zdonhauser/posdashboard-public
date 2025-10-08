import React, { useState, useEffect, useRef, useMemo } from "react";
import "./ButtonGrid.scss";
import * as Types from "../POSWindow/POSTypes";
import defaultphoto from "./default_photo.png";
import nophoto from "../POSWindow/no_photo.png";
import PhotoUploadForm from "../CameraModal/PhotoUploadForm";
import { soundManager } from "../POSWindow/sounds/soundManager";
import { processSubscriptionData } from "../MembersTable/processSubscriptionData";
import { usePOS } from "../../contexts/POSContext";
import { useUser } from "../../App";
import { toast } from "react-toastify";

export default function ButtonGrid() {
  const {
    thisOrderItems,
    setThisOrderItems,
    typedValue,
    setTypedValue,
    orderId,
    members,
    setMembers,
    setOrder,
    searchMembers,
    searchOrders,
    clearOrder,
    subs,
    giftCards,
    scannedItem,
    setScannedItem,
    triggerReset,
    setTriggerReset,
    isDelete,
    setIsDelete,
    currentTab,
    setCurrentTab,
    discountCodes,
    setDiscountCodes,
    customer,
    setCustomer,
    isBFF,
    orderSearchResults,
    mode,
  } = usePOS();

  const { user } = useUser();

  const [buttonlist, setButtonlist] = useState<Types.ExtendedLineItem[]>([]);
  const [numOfMods, setNumOfMods] = useState(0);
  const [modClass, setModClass] = useState<number | undefined>(0);
  const [parentModClass, setParentModClass] = useState<number | undefined>(0);
  const [modifyingItemIndex, setModifyingItemIndex] = useState<number | null>(
    null
  );
  const [triggerMembers, setTriggerMembers] = useState(0);
  const [triggerOrderSearch, setTriggerOrderSearch] = useState(0);
  const [allMods, setAllMods] = useState<number[]>([]);
  const [modifierModItems, setModifierModItems] = useState<
    Types.ExtendedLineItem[]
  >([]);
  const [modItems, setModItems] = useState<Types.ExtendedLineItem[]>([]);
  const [inputValues, setInputValues] = useState({});
  //if (!buttonlist) { setButtonlist(admission) }
  const [buttons, setButtons] = useState([]);
  //let buttons = [];
  //const buttonlist: LineItem[] = admission;
  const buttonarea = useMemo(() => {
    const result: string[] = [];
    const gridWidth = 420;
    const tabRows = 40;
    let buttonSize;

    if (buttonlist.length <= 1) buttonSize = gridWidth;
    else if (buttonlist.length <= 4) buttonSize = gridWidth / 2;
    else if (buttonlist.length <= 9) buttonSize = gridWidth / 3;
    else if (buttonlist.length <= 16) buttonSize = gridWidth / 4;
    else if (buttonlist.length <= 25) buttonSize = gridWidth / 5;
    else if (buttonlist.length <= 36) buttonSize = gridWidth / 6;
    else if (buttonlist.length <= 49) buttonSize = gridWidth / 7;
    else buttonSize = gridWidth / 7;

    for (let j = 0; j < buttonlist.length; j++) {
      const rowStart =
        Math.floor(j / (gridWidth / buttonSize)) * buttonSize + 1 + tabRows;
      const colStart = (j % (gridWidth / buttonSize)) * buttonSize + 1;
      result[
        j
      ] = `${rowStart} / ${colStart} / span ${buttonSize} / span ${buttonSize}`;
    }
    return result;
  }, [buttonlist.length]);
  const [selectedMember, setSelectedMember] = useState<Types.Member | null>(
    null
  );
  const [showPhotoUploadForm, setShowPhotoUploadForm] = useState(false);
  const [editedMember, setEditedMember] =
    useState<Types.ExtendedLineItem | null>(null);

  const [isEditMember, setIsEditMember] = useState(false);
  const [isAddBarcode, setIsAddBarcode] = useState(false);
  const [triggerGCs, setTriggerGCs] = useState(0);
  const [triggerButtonBuild, setTriggerButtonBuild] = useState(0);
  const [tabData, setTabData] = useState({});
  const [modData, setModData] = useState({});
  const [modClassesData, setModClassesData] = useState({});
  const [creatingForm, setCreatingForm] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedPLUItem, setSelectedPLUItem] =
    useState<Types.ExtendedLineItem | null>(null);
  const [barcode, setBarcode] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    currentItem: Types.ExtendedLineItem | null;
  }>({ visible: false, x: 0, y: 0, currentItem: null });
  const [modUpdateTrigger, setModUpdateTrigger] = useState(false);
  const barcodeBufferRef = useRef("");
  const timeoutRef = useRef(null);
  const [bufferedBarcode, setBufferedBarcode] = useState("");
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [itemToModify, setItemToModify] =
    useState<Types.ExtendedLineItem | null>(null);
  const [modifyValues, setModifyValues] = useState({
    title: "",
    original_unit_price: 0,
    kds_station: "",
    kds_enabled: false,
    variant_id: null,
    line_item_id: null,
  });
  const [showShopifyConnector, setShowShopifyConnector] = useState(false);
  const [shopifyQuery, setShopifyQuery] = useState("");
  const [shopifyResults, setShopifyResults] = useState([]);
  const [showCreateShopifyModal, setShowCreateShopifyModal] = useState(false);
  const [newShopifyValues, setNewShopifyValues] = useState({
    title: "",
    price: 0,
    sku: "",
    vendor:"",

  });

  const barcodeModalInputRef = useRef<HTMLInputElement>(null);
const addMemberBarcodeInputRef = useRef<HTMLInputElement>(null);
const modifyBarcodeInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (showBarcodeModal) {
    // let React render the modal first
    setTimeout(() => barcodeModalInputRef.current?.focus(), 0);
  }
}, [showBarcodeModal]);

useEffect(() => {
  if (isAddBarcode) {
    setTimeout(() => addMemberBarcodeInputRef.current?.focus(), 0);
  }
}, [isAddBarcode]);

useEffect(() => {
  if (showModifyModal) {
    setTimeout(() => modifyBarcodeInputRef.current?.focus(), 0);
  }
}, [showModifyModal]);

  // When the modify modal is opened, initialize modifyValues based on the selected item.
  useEffect(() => {
    if (showModifyModal && itemToModify) {
      setModifyValues({
        title: itemToModify.title || itemToModify.name || "",
        original_unit_price: itemToModify.original_unit_price || 0,
        kds_station: itemToModify.kds_station || "",
        kds_enabled: itemToModify.kds_enabled || false,
        variant_id: itemToModify.variant_id || null,
        line_item_id: itemToModify.line_item_id || null,
      });
    }
  }, [showModifyModal, itemToModify]);

  // Modified handleModifySubmit function to submit changes to the backend endpoint
  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToModify) return; // Ensure an item is selected

    // Build the payload using the item's id and updated values
    const payload = {
      id: itemToModify.plu_id, // Use the database id to update the correct record
      title: modifyValues.title,
      original_unit_price: modifyValues.original_unit_price,
      kds_station: modifyValues.kds_station,
      kds_enabled: modifyValues.kds_enabled,
      variant_id: modifyValues.variant_id,
      line_item_id: modifyValues.line_item_id,
    };

    try {
      // Send the PUT request to update the PLU item in the database
      const response = await fetch("/api/modify-plu-item", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        //refresh the whole component
        window.location.reload();
      } else {
        // Log the error response from the backend
        const errorData = await response.json();
        toast.error("Error updating item:" + errorData.error);
      }
    } catch (error) {
      toast.error("Network error while updating item:" + error);
    }

    // Close the modify modal and clear the selected item
    setShowModifyModal(false);
    setItemToModify(null);
  };

  // Add event listeners to track Delete/Backspace keydown and keyup
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        setIsDelete(true); // Set isDelete to true when either key is held down
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        setIsDelete(false); // Reset isDelete when the keys are released
      }
    };

    // Attach event listeners to the window object
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const processBarcode = () => {
    const barcode = barcodeBufferRef.current;
    setBufferedBarcode(barcode);
    // Process the barcode
    //barcodeBufferRef.current = ''; // Reset buffer after processing
  };

  useEffect(() => {
    if (!shopifyQuery) {
      setShopifyResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/shopify-products?q=${encodeURIComponent(shopifyQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch Shopify products");

        const data = await response.json();
        setShopifyResults(data || []);
      } catch (error) {
        toast.error("Failed to load Shopify products: " + error.message);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [shopifyQuery]);

  useEffect(() => {
    const fetchModifiersForButtons = async () => {
      const initialModClasses = buttonlist.flatMap((button) => [
        ...(button.required_mods || []),
        ...(button.optional_mods || []),
      ]);

      const seen = new Set<number>(Object.keys(modClassesData).map(Number));
      const localCache = { ...modClassesData }; // Local working copy to update incrementally
      const queue = [
        ...new Set(initialModClasses.filter((cls) => !seen.has(cls))),
      ];

      while (queue.length > 0) {
        const batch = queue.splice(0, 10); // batch size to prevent overload

        try {
          const response = await fetch(
            `/api/get-mods?modClasses=${batch.join(",")}`,
            {
              headers: {
                "Content-type": "application/json; charset=UTF-8",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
            }
          );

          const modsFetchedFromServer = await response.json();

          const filteredMods = modsFetchedFromServer.map(
            (mod: Types.ExtendedLineItem) => {
              if (
                !mod.auth ||
                mod.auth.some((auth: string) =>
                  user.position.toLowerCase().includes(auth.toLowerCase())
                )
              ) {
                return mod;
              } else {
                //return empty button
                return {} as Types.ExtendedLineItem;
              }
            }
          );

          for (const mod of filteredMods) {
            const modClass = mod.mod;

            if (!localCache[modClass]) localCache[modClass] = [];
            localCache[modClass].push(mod);

            // Discover nested modClasses to fetch
            const nested = [
              ...(mod.required_mods || []),
              ...(mod.optional_mods || []),
            ];

            for (const nestedMod of nested) {
              if (!seen.has(nestedMod)) {
                seen.add(nestedMod);
                queue.push(nestedMod);
              }
            }
          }

          // Ensure empty arrays are added for all fetched modClasses not returned
          for (const modClass of batch) {
            if (!localCache[modClass]) {
              localCache[modClass] = [];
            }
          }
        } catch (error) {
          toast.error("Failed to fetch nested modifiers:" + error);
        }
      }

      setModClassesData(localCache); // Final single React update
    };

    const fetchModifiersForButtonList = async () => {
      const modClassesToFetch: number[] = [];

      for (const button of buttonlist) {
        if (button.modClass) modClassesToFetch.push(button.modClass);
        if (button.required_mods)
          modClassesToFetch.push(...button.required_mods);
        if (button.optional_mods)
          modClassesToFetch.push(...button.optional_mods);
      }

      const uniqueModClasses = [...new Set(modClassesToFetch)];

      const recursivelyFetchMods = async (
        initialModClasses: number[],
        baseCache: Record<number, Types.ExtendedLineItem[]>
      ) => {
        const seen = new Set<number>(Object.keys(baseCache).map(Number));
        const queue = [...initialModClasses.filter((cls) => !seen.has(cls))];
        const modDataCache: Record<number, Types.ExtendedLineItem[]> = {
          ...baseCache,
        };

        for (const cls of initialModClasses) seen.add(cls);

        while (queue.length > 0) {
          const batch = queue.splice(0, 10); // Limit request size

          try {
            const response = await fetch(
              `/api/get-pos-mods/${batch.join(",")}`,
              {
                headers: {
                  "Content-type": "application/json; charset=UTF-8",
                  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
              }
            );

            const groupedMods: Record<number, Types.ExtendedLineItem[]> =
              await response.json();

            for (const modClass of batch) {
              if (!(modClass in groupedMods)) {
                // If no data returned, cache empty array
                modDataCache[modClass] = [];
              }
            }

            for (const [modClassStr, mods] of Object.entries(groupedMods)) {
              const modClass = parseInt(modClassStr, 10);

              const filteredMods = mods.map((mod: Types.ExtendedLineItem) => {
                if (
                  !mod.auth ||
                  mod.auth.some((auth: string) =>
                    user.position.toLowerCase().includes(auth.toLowerCase())
                  )
                ) {
                  return mod;
                } else {
                  //return empty button
                  return {} as Types.ExtendedLineItem;
                }
              });

              if (!(modClass in modDataCache)) {
                modDataCache[modClass] = filteredMods;
              }
              for (const mod of filteredMods) {
                const nestedModClasses = [
                  ...(mod.required_mods || []),
                  ...(mod.optional_mods || []),
                ];

                for (const child of nestedModClasses) {
                  if (!seen.has(child)) {
                    seen.add(child);
                    queue.push(child);
                  }
                }
              }
            }
          } catch (error) {
            toast.error("Failed to fetch modifiers:" + error);
          }
        }

        return modDataCache;
      };

      const updatedModData = await recursivelyFetchMods(
        uniqueModClasses,
        modData
      );
      setModData(updatedModData);
    };

    if (buttonlist.length > 0) {
      fetchModifiersForButtonList();
      fetchModifiersForButtons();
    }
  }, [buttonlist]);

  useEffect(() => {
    //wait for 1 second then clear the barcode
    if (bufferedBarcode) {
      setTimeout(() => {
        setBufferedBarcode("");
        barcodeBufferRef.current = "";
      }, 500);
    }
  }, [bufferedBarcode]);

  useEffect(() => {
    const handleKeydown = (event) => {
      // Check if the keydown event is from the barcode scanner (or a rapid input source)
      if (event.key?.length === 1) {
        // assuming barcode characters are single characters like numbers or letters
        barcodeBufferRef.current += event.key;

        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(processBarcode, 100); // adjust delay as needed
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleRightClick = (event, item) => {
    event.preventDefault(); // Prevent the default context menu
    if (user.admin) {
      let y = event.clientY;
      const menuHeight = 200; // height of the context menu
      const screenBottom = window.innerHeight;
      if (y + menuHeight > screenBottom) {
        y = screenBottom - menuHeight;
      }

      setContextMenu({
        visible: true,
        x: event.clientX,
        y,
        currentItem: item,
      });
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (contextMenu.visible && !event.target.closest(".context-menu")) {
        setContextMenu({ visible: false, x: 0, y: 0, currentItem: null });
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [contextMenu.visible]);

  useEffect(() => {
    if (scannedItem) {
      addItem(scannedItem);
      setScannedItem(null);
    }
  }, [scannedItem]);

  useEffect(() => {
    //setCurrentTab(1);
    setNumOfMods(0);
    setModItems([]);
    setModifierModItems([]);
    setParentModClass(null);
    setModUpdateTrigger((prev) => !prev);
    setTriggerButtonBuild((prev) => prev + 1);
    setAllMods([]);
    setModClass(null);
    setNumOfMods(0);
    if (thisOrderItems.length > 0) {
      //set mod class based on final item
      const baseItem = thisOrderItems[thisOrderItems.length - 1];

      setParentModClass(baseItem?.modClass || null);
      setModClass(baseItem?.modClass || null);

      if (!baseItem.isMod) {
        const modsToFetchArray = (baseItem.required_mods || []).concat(
          baseItem.optional_mods || []
        );
        const uniqueModsToFetchArray = [...new Set(modsToFetchArray)];
        // All mods are in cache (including those with empty arrays)
        const cachedMods = uniqueModsToFetchArray.flatMap((modClass) => {
          const mods = modClassesData[modClass] || [];
          return mods.map((mod) => ({ ...mod })); // Clone mods to prevent mutation
        });
        setModItems(cachedMods);
      }
      if (baseItem.properties?.length) {
        //if the final property has modMods
        const finalProperty =
          baseItem.properties[baseItem.properties.length - 1];
        if (finalProperty.modMods) {
          // All mods are in cache (including those with empty arrays)
          const cachedMods = finalProperty.modMods.flatMap((modClass) => {
            const mods = modClassesData[modClass] || [];
            return mods.map((mod) => ({ ...mod })); // Clone mods to prevent mutation
          });

          //for each cached mod, set isModifierMod to true
          cachedMods.forEach((mod) => {
            mod.isModifierMod = true;
          });
          setModifierModItems(cachedMods);
        }
      }
    }
  }, [triggerReset]);

  useEffect(() => {
    // create member buttons and gift card buttons
    const gcButtons = giftCards.map((card: Types.GiftCard) => {
      return {
        title: card.items + " Gift Card",
        subtitle: card.card_number,
        barcode: card.card_id,
        price: 0,
        quantity: 1,
        max_quantity: 1,
        properties: [
          ...(card.expiration
            ? [
                {
                  name: "Expiration",
                  value: new Date(card.expiration).toLocaleDateString(),
                },
              ]
            : []),
          {
            name: "Card Number",
            value: card.card_number,
          },
          ...(card.issued_to
            ? [
                {
                  name: "Issued To",
                  value: card.issued_to.toString(),
                },
              ]
            : []),
        ],
        function: "redeemGC",
        attendance_category: "Gift Card",
        valid_until_string: new Date(
          card.expiration || "12/31/3000"
        ).toISOString(),
        valid_until: new Date(card.expiration || "12/31/3000"),
        valid_starting: new Date(card.valid_starting || "1/1/2000"),
        redeemed: card.redeem_timestamp || null,
      };
    });
    const memberButtons = members.map((member) => {
      const visitsFromVisitsArray = member.visits_array
        ? member.visits_array.filter((visit) => {
            const visitDate = new Date(visit);
            const today = new Date();
            return visitDate.toDateString() === today.toDateString();
          }).length
        : 0;
      const visitsFromOrderItems = thisOrderItems.reduce((count, item) => {
        return (
          count + (item.membership_number === member.membership_number ? 1 : 0)
        );
      }, 0);
      const totalVisitsToday = visitsFromVisitsArray + visitsFromOrderItems;

      let sub;
      let updatedMember: Types.Member = member;
      if (member.sub_id && subs.length > 0) {
        sub = subs.find((sub) => Number(sub.id) === Number(member.sub_id));
        if (sub) {
          updatedMember = {
            ...member,
            ...processSubscriptionData(sub, member),
          };
        }
      }

      const memberObject = {
        name: member.name || "No Name",
        title: `${member.membership_type} Check-In`,
        attendance_category: "Member",
        calendar_category: "Member",
        barcode: member.barcode || null,
        price: 0,
        quantity: 1,
        photo: member.photo || defaultphoto,
        hasPhoto: member.photo == nophoto ? false : true,
        membership_type: member.membership_type,
        membership_number: member.membership_number,
        status: updatedMember.status || member.status || null,
        due_date: new Date(updatedMember.due_date || member.due_date) || null,
        next_payment:
          new Date(updatedMember.due_date || member.due_date) || null,
        valid_until:
          new Date(updatedMember.valid_until || member.valid_until) || null,
        valid_until_string:
          updatedMember.valid_until_string ||
          member.valid_until?.toString().split("T")[0] ||
          null,
        max_quantity: 1,
        sub_id: member.sub_id,
        sub: sub,
        dob: member.dob,
        dobstring: member.dob ? member.dob.split("T")[0] : null,
        signup_date:
          new Date(updatedMember.signup_date || member.signup_date) || null,
        payments_remaining: updatedMember.payments_remaining || null,
        payment_amount: updatedMember.payment_amount || null,
        edit_url: updatedMember.edit_url || null,
        valid_starting:
          new Date(updatedMember.valid_starting || member.valid_starting) ||
          null,
        properties: [
          {
            name: "membership_number",
            value: member.membership_number.toString(),
          },
          {
            name: "name",
            value: member.name,
          },
        ],
        function: "checkIn",
        ...(member.visits_array?.length
          ? { last_visit: new Date(member.visits_array[0]) }
          : {}),
        ...(member.visits_array?.length
          ? { visits: member.visits_array?.length }
          : {}),
        visitsToday: totalVisitsToday,
        currentVisits: visitsFromOrderItems,
        totalPaid: updatedMember.total_paid || null,
        alert: member.alert || null,
        email: updatedMember.email || null,
      };
      return memberObject;
    });

    if (currentTab === 7) {
      if (memberButtons.length > 0) {
        if (memberButtons.length + gcButtons.length < 25) {
          setButtonlist([...memberButtons, ...gcButtons]);
        } else {
          setButtonlist(memberButtons);
        }
      } else {
        setCurrentTab(1);
      }
    } else if (currentTab === 9) {
      if (giftCards.length > 0) {
        if (memberButtons.length + gcButtons.length < 25) {
          setButtonlist([...gcButtons, ...memberButtons]);
        } else {
          setButtonlist(gcButtons);
        }
      } else {
        setCurrentTab(1);
      }
    }
  }, [giftCards, triggerGCs, members, subs, triggerMembers, thisOrderItems]); //trigger creation of gift cards

  useEffect(() => {
    if (orderSearchResults.length > 0 && currentTab == 6) {
      const orderButtons = orderSearchResults.map((order: Types.Order) => {
        const items = order.line_items || [];
        const itemsList = items.map((item) => {
          return `${item.quantity}x${item.title}`;
        });
        let title = " ";
        if (order.customer) {
          title = order.customer?.first_name + " " + order.customer?.last_name;
        } else if (order.order_number) {
          title = `Order ${order.order_number}`;
        }
        return {
          title: title,
          subtitle: itemsList.toString(),
          barcode: order.id,
          function: "searchOrders",
          order: order,
          price: 0,
          quantity: 0,
          date: new Date(order.created_at).toLocaleDateString(),
          status: order.cancelled_at ? "Cancelled" : order.fulfillment_status,
        };
      });
      setButtonlist(orderButtons);
    }
  }, [orderSearchResults, triggerOrderSearch]); //trigger creation of order search buttons

  useEffect(() => {
    let isCurrent = true; // Add flag to track if this effect is still current
    const requestTab = currentTab; // Capture initial tab value
    const fetchMods = async (modClassToFetch) => {
      if (!isCurrent || currentTab !== requestTab) return []; // Return early if stale
      if (modData[modClassToFetch]) {
        // Return a cloned copy of the cached modifiers
        return modData[modClassToFetch].map((mod) => ({ ...mod }));
      }
      try {
        const response = await fetch(`/api/get-pos-mods/${modClassToFetch}`, {
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        const groupedMods: Record<number, Types.ExtendedLineItem[]> =
          await response.json();

        const filteredMods: Record<number, Types.ExtendedLineItem[]> =
          Object.fromEntries(
            Object.entries(groupedMods)
              .map(([groupId, mods]) => {
                // Filter mods in each group based on auth
                const allowedMods = mods.filter((mod) => {
                  return (
                    !mod.auth ||
                    mod.auth.some((auth: string) =>
                      user.position.toLowerCase().includes(auth.toLowerCase())
                    )
                  );
                });

                // If any mods remain after filtering, keep the group
                return [Number(groupId), allowedMods];
              })
              .filter(Boolean) as [number, Types.ExtendedLineItem[]][]
          );

        // Update modData with all returned groups
        setModData((prev) => ({
          ...prev,
          ...filteredMods,
        }));
        // Return the specific group we were looking for
        return filteredMods[modClassToFetch]?.map((mod) => ({ ...mod })) || [];
      } catch (error) {
        toast.error("Failed to fetch mods:" + error);
        return [];
      }
    };

    const mergeParentMods = (
      mods: Types.ExtendedLineItem[],
      parentMods: Types.ExtendedLineItem[],
      reverse = false
    ) => {
      const merged = [...mods];
      let parentIndex = 0;
      for (
        let i = reverse ? merged.length - 1 : 0;
        reverse ? i >= 0 : i < merged.length;
        reverse ? i-- : i++
      ) {
        if (!merged[i].title && parentMods[parentIndex]) {
          merged[i] = parentMods[parentIndex];
          parentIndex++;
        }
        if (parentIndex >= parentMods.length) break;
      }
      return merged;
    };

    const handleModsFetch = async () => {
      if (!isCurrent || currentTab !== requestTab) return;

      let parentMods = [];
      if (parentModClass && parentModClass > 0) {
        const fetchedParentMods = await fetchMods(parentModClass);
        if (!isCurrent || currentTab !== requestTab) return;
        parentMods = fetchedParentMods.map((mod) => ({ ...mod }));
        for (let i = 0; i < parentMods.length; i++) {
          let modCount = 0;
          let modClassCount = 0;
          if (parentMods[i].max_quantity && buttonlist.length > 0) {
            const lastItem = thisOrderItems[thisOrderItems.length - 1];
            for (let j = 0; j < lastItem?.properties?.length; j++) {
              if (lastItem.properties[j].value.includes(parentMods[i].title)) {
                modCount++; //count how many times the mod is used
              }
            }
            if (
              modCount >=
              parentMods[i].max_quantity * Math.abs(lastItem?.quantity)
            ) {
              // if it's already over the max, mark as excluded
              // Instead of setting to null, mark as excluded
              parentMods[i] = { ...parentMods[i], excluded: true };
            }
          }
          if (parentMods[i].max_modClass && buttonlist.length > 0) {
            const lastItem = thisOrderItems[thisOrderItems.length - 1];
            for (let j = 0; j < lastItem?.properties?.length; j++) {
              if (lastItem.properties[j].modClass == parentMods[i].modClass) {
                modClassCount++; //count how many times the mod is used
              }
            }
            console.log("modclass count: ", modClassCount);
            if (
              modClassCount >=
              parentMods[i].max_modClass * Math.abs(lastItem?.quantity)
            ) {
              // if it's already over the max, mark as excluded
              // Instead of setting to null, mark as excluded
              parentMods[i] = { ...parentMods[i], excluded: true };
            }
          }
          if (parentMods[i].mod_class && parentMods[i].mod_class !== 255000) {
            if (Math.floor(parentMods[i].mod_class / 1000) !== modClass) {
              parentMods[i] = { ...parentMods[i], excluded: true };
            }
          }
        }
        // Filter out excluded mods
        parentMods = parentMods.filter((mod) => !mod.excluded);
      }

      let theseModItems = modItems.map((mod) => ({ ...mod })); // Clone modItems
      if (theseModItems.length > 0) {
        for (let i = 0; i < theseModItems.length; i++) {
          let modCount = 0;
          let modClassCount = 0;
          if (theseModItems[i].max_quantity && buttonlist.length > 0) {
            const lastItem = thisOrderItems[thisOrderItems.length - 1];
            for (let j = 0; j < lastItem?.properties?.length; j++) {
              if (lastItem.properties[j].value == theseModItems[i].title) {
                modCount++;
              }
            }
            if (
              modCount >=
              theseModItems[i].max_quantity * Math.abs(lastItem?.quantity)
            ) {
              // Mark as excluded
              theseModItems[i] = { ...theseModItems[i], excluded: true };
            }
          }
          if (theseModItems[i].max_modClass && buttonlist.length > 0) {
            //console.log("modclass count exists");
            const lastItem = thisOrderItems[thisOrderItems.length - 1];
            for (let j = 0; j < lastItem?.properties?.length; j++) {
              if (
                lastItem.properties[j].modClass == theseModItems[i].modClass
              ) {
                modClassCount++; //count how many times the mod is used
              }
            }
            if (
              modClassCount >=
              theseModItems[i].max_modClass * Math.abs(lastItem?.quantity)
            ) {
              // if it's already over the max, mark as excluded
              // Instead of setting to null, mark as excluded
              theseModItems[i] = { ...theseModItems[i], excluded: true };
            }
          }
        }
        // Filter out excluded mods
        theseModItems = theseModItems.filter((mod) => !mod.excluded);
      }

      let theseModifierModItems = modifierModItems.map((mod) => ({ ...mod }));
      if (modClass > 0 && (currentTab == 5 || numOfMods > 0)) {
        //required mods
        let fetchedMods = await fetchMods(modClass);
        //filter out based on max_quantity and max_modClass
        let modCount = 0;
        let modClassCount = 0;
        for (let i = 0; i < fetchedMods.length; i++) {
          if (fetchedMods[i].max_quantity && buttonlist.length > 0) {
            const lastItem = thisOrderItems[thisOrderItems.length - 1];
            for (let j = 0; j < lastItem?.properties?.length; j++) {
              if (lastItem.properties[j].value.includes(fetchedMods[i].title)) {
                modCount++; //count how many times the mod is used
              }
            }
            if (
              modCount >=
              fetchedMods[i].max_quantity * Math.abs(lastItem?.quantity)
            ) {
              // if it's already over the max, mark as excluded
              // Instead of setting to null, mark as excluded
              fetchedMods[i] = { ...fetchedMods[i], excluded: true };
            }
          }
          if (fetchedMods[i].max_modClass && buttonlist.length > 0) {
            console.log("modclass count exists");
            const lastItem = thisOrderItems[thisOrderItems.length - 1];
            for (let j = 0; j < lastItem?.properties?.length; j++) {
              console.log(
                "comparing: ",
                lastItem.properties[j].modClass,
                fetchedMods[i].modClass,
                lastItem?.quantity
              );
              if (lastItem.properties[j].modClass == fetchedMods[i].modClass) {
                modClassCount++; //count how many times the mod is used
              }
            }
            if (
              modClassCount >=
              fetchedMods[i].max_modClass * Math.abs(lastItem?.quantity)
            ) {
              // if it's already over the max, mark as excluded
              // Instead of setting to null, mark as excluded
              fetchedMods[i] = { ...fetchedMods[i], excluded: true };
            }
          }
        }
        // Filter out excluded mods
        fetchedMods = fetchedMods.filter((mod) => !mod.excluded);

        if (!isCurrent || currentTab !== requestTab) return;
        const mods = fetchedMods.map((mod) => ({ ...mod }));
        mods.sort((a, b) => (a.sku > b.sku ? 1 : -1));
        const mergedMods = mergeParentMods(
          mergeParentMods(mergeParentMods(mods, parentMods), theseModItems),
          theseModifierModItems,
          true
        );
        setButtonlist(mergedMods);
      } else if (numOfMods > 0 && modClass == 0) {
        if (!isCurrent || currentTab !== requestTab) return;
        setCurrentTab(5);
        setNumOfMods(0);
      } else if (currentTab <= 4 || currentTab == 11) {
        //current tab plus optional mods
        //for tabs 1-4, take tab data for that tab and add in mods if necessary to fill in blank spaces
        if (tabData[currentTab]) {
          if (!isCurrent || currentTab !== requestTab) return;
          //count the current number of mods and make sure its below num_of_mods_max
          const currentNumOfMods =
            thisOrderItems[thisOrderItems.length - 1]?.properties?.length || 0;
          let mergedMods = [];
          if (
            thisOrderItems[thisOrderItems.length - 1]?.num_of_mods_max &&
            currentNumOfMods >=
              thisOrderItems[thisOrderItems.length - 1]?.num_of_mods_max
          ) {
            mergedMods.push(...tabData[currentTab]);
          } else {
            mergedMods = mergeParentMods(
              mergeParentMods(
                mergeParentMods(tabData[currentTab], parentMods),
                theseModItems
              ),
              theseModifierModItems,
              true
            );
          }
          setButtonlist(mergedMods);
        } else {
          try {
            const response = await fetch(`/api/get-pos-by-tab/${currentTab}`, {
              headers: {
                "Content-type": "application/json; charset=UTF-8",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
            });
            const posButtons = await response.json();
            const filteredPosButtons = posButtons.map(
              (btn: Types.ExtendedLineItem) => {
                if (
                  !btn.auth ||
                  btn.auth.some((auth: string) =>
                    user.position.toLowerCase().includes(auth.toLowerCase())
                  )
                ) {
                  return btn;
                } else {
                  //return empty button
                  return {} as Types.ExtendedLineItem;
                }
              }
            );
            if (!isCurrent || currentTab !== requestTab) return;
            const mergedMods = mergeParentMods(
              mergeParentMods(
                mergeParentMods(filteredPosButtons, parentMods),
                theseModItems
              ),
              theseModifierModItems,
              true
            );
            setButtonlist(mergedMods);
            setTabData((prev) => ({
              ...prev,
              [currentTab]: filteredPosButtons,
            }));
          } catch (error) {
            toast.error("Failed to fetch POS tabs:" + error);
          }
        }
      } else if (currentTab == 5) {
        if (!isCurrent || currentTab !== requestTab) return;
        setCurrentTab(1);
      } else if (currentTab == 7) {
        setTriggerMembers((prev) => prev + 1);
      } else if (currentTab == 6) {
        setTriggerOrderSearch((prev) => prev + 1);
      } else if (currentTab == 8) {
        return;
      } else if (currentTab == 9) {
        setTriggerGCs((prev) => prev + 1);
      } else if (currentTab == 10) {
        const fetchedMods = await fetchMods(255);
        if (!isCurrent || currentTab !== requestTab) return;
        const mods = fetchedMods.map((mod: Types.ExtendedLineItem) => ({
          ...mod,
        }));
        mods.sort((a, b) => a.title.localeCompare(b.title));
        setButtonlist(mods);
      } else {
        if (!isCurrent || currentTab !== requestTab) return;
        setButtonlist([]);
        setNumOfMods(0);
      }
      if (currentTab != 8) {
        setInputValues({});
      }
    };

    handleModsFetch();

    return () => {
      isCurrent = false; // Cleanup function to mark effect as stale
    };
  }, [numOfMods, currentTab, modUpdateTrigger, parentModClass, thisOrderItems]); // Fetch buttons on tab set

  useEffect(() => {
    if (modifierModItems.length > 0) {
      console.log("modifierModItems changed", modifierModItems);
    }
    setModUpdateTrigger((prev) => !prev);
  }, [modItems, modifierModItems]);

  // useEffect for initializing input values
  useEffect(() => {
    if (members.length == 1 && modItems.length && allMods && currentTab == 7) {
      const initialValues = {};
      allMods.forEach((mod) => {
        const modItem = modItems.find((item) => item.mod === mod);
        const inputKey = modItem ? modItem.title : mod;
        if (modItem.mod_type == "date" && members[0]?.[inputKey]) {
          // Check if the type is 'date' and the value is not empty
          // Convert the input value to a Date object
          const date = new Date(members[0]?.[inputKey]);
          let formattedValue = members[0]?.[inputKey];
          // Format the date to YYYY-MM-DD, which is the format expected by HTML date inputs
          const year = date.getFullYear();
          const month = `0${date.getMonth() + 1}`.slice(-2); // Add leading 0 if needed
          const day = `0${date.getDate()}`.slice(-2); // Add leading 0 if needed

          formattedValue = `${year}-${month}-${day}`;
          initialValues[inputKey] = formattedValue || null;
        } else {
          initialValues[inputKey] = members[0]?.[inputKey] || null;
        }
      });

      setInputValues(initialValues);
    }
  }, [members, allMods, modItems]); // Only re-run when members, allMods, or modItems changes

  useEffect(() => {
    if (thisOrderItems.length > 0 && modItems.length > 0 && !creatingForm) {
      setCreatingForm(true);
      const formElements: any[] = [];
      const handleInputChange = (modID, value, type?) => {
        let formattedValue = value;

        if (type === "date") {
          // Split the input value to analyze its parts
          const dateParts = value.split("-");

          // Proceed only if all date parts are present
          if (dateParts.length === 3) {
            const year = dateParts[0];
            const month = dateParts[1];
            const day = dateParts[2];

            // Validate the year part more rigorously
            if (year.length === 4 && parseInt(year, 10) > 1900) {
              // Format month and day to ensure they are always two digits
              const formattedMonth = month.padStart(2, "0");
              const formattedDay = day.padStart(2, "0");
              formattedValue = `${year}-${formattedMonth}-${formattedDay}`;
            } else {
              // If the year part is not valid, consider how you want to handle this
              // For example, you might not update the state or you might set an error message
              return; // Exit without updating the state
            }
          } else {
            // If not all parts are present, don't attempt to format the date
            return; // Exit without updating the state
          }
        }

        // Update the state with the validated and potentially formatted date
        setInputValues((prev) => ({ ...prev, [modID]: formattedValue }));
      };

      const handleKeyDown = (e, inputIndex, modId) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (barcodeBufferRef.current !== "") {
            // Wait for the bufferedBarcode to be available
            setTimeout(() => {
              setInputValues((prev) => ({
                ...prev,
                [modId]: barcodeBufferRef.current,
              }));
            }, 100);
          }

          // Find the next input field and focus on it
          const nextInput = document.querySelectorAll(".modifier-form input")[
            inputIndex + 1
          ] as HTMLElement;
          if (nextInput) {
            nextInput.focus();
          }
        }
      };
      allMods.forEach((mod, index) => {
        const filteredModItems = modItems.filter((item) => item.mod === mod);

        if (filteredModItems.length === 1 && filteredModItems[0].mod_type) {
          setCurrentTab(8);
          const modItem = filteredModItems[0];
          const inputKey = `${modItem.title}`; // Unique key for each input

          switch (modItem.mod_type) {
            case "string":
              formElements.push(
                <React.Fragment key={`${inputKey}-${index}`}>
                  {inputKey}
                  <br />
                  <input
                    key={`${inputKey}-${index}`}
                    type="text"
                    value={inputValues[inputKey] || ""}
                    onChange={(e) => {
                      handleInputChange(inputKey, e.target.value);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, index, inputKey)}
                    placeholder={`Enter ${modItem.title}`}
                  />
                  <br />
                  <br />
                </React.Fragment>
              );
              break;
            case "number":
              formElements.push(
                <React.Fragment key={`${inputKey}-${index}`}>
                  {inputKey}
                  <br />
                  <input
                    key={`${inputKey}-${index}`}
                    type="number"
                    value={inputValues[inputKey] || 0}
                    onChange={(e) =>
                      handleInputChange(
                        inputKey,
                        e.target.value.replace(/^0+/g, "")
                      )
                    }
                    onKeyDown={(e) => handleKeyDown(e, index, inputKey)}
                    placeholder={`Enter ${modItem.title}`}
                  />
                  <br />
                  <br />
                </React.Fragment>
              );
              break;
            case "date":
              formElements.push(
                <React.Fragment key={`${inputKey}-${index}`}>
                  {inputKey}
                  <br />
                  <input
                    key={`${inputKey}-${index}`}
                    type="date"
                    value={inputValues[inputKey] || null}
                    onChange={(e) =>
                      handleInputChange(inputKey, e.target.value, "date")
                    }
                    onKeyDown={(e) => handleKeyDown(e, index, inputKey)}
                  />
                  <br />
                  <br />
                </React.Fragment>
              );
              break;
            case "boolean":
              formElements.push(
                <React.Fragment key={`${inputKey}-${index}`}>
                  {inputKey}
                  <br />
                  <input
                    key={`${inputKey}-${index}`}
                    type="checkbox"
                    checked={!!inputValues[inputKey]}
                    onChange={(e) =>
                      handleInputChange(inputKey, e.target.checked, inputKey)
                    }
                  />
                  <br />
                  <br />
                </React.Fragment>
              );
              break;
            // Add cases for other mod types as needed
          }
        }
      });
      let modifierFormButton;
      if (formElements.length > 0) {
        modifierFormButton = (
          <div
            key={`buttondiv-form`}
            id={"buttondiv-form"}
            className="button"
            style={{
              gridArea: `6 / 2 / span 60 / span 60`,
            }}
          >
            <form className="modifier-form" onSubmit={handleFormSubmit}>
              {formElements}
              <button type="submit" className="submit-mods-button">
                Apply
              </button>
            </form>
          </div>
        );
        setButtons([modifierFormButton]); // Add this form as a 'button' in your grid
      }
      setCreatingForm(false);
    }
  }, [modItems, inputValues]); //create mod form

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Retrieve the last added item
    const lastAddedItemIndex = thisOrderItems.length - 1;
    const lastAddedItem = thisOrderItems[lastAddedItemIndex];
    if (!lastAddedItem.properties) {
      lastAddedItem.properties = [];
    }
    // Apply modifiers from form input values
    Object.entries(inputValues).forEach(([modID, value]) => {
      if (value) {
        const modifier = modItems.find(
          (item) => item.title.toString() === modID
        );
        if (modifier) {
          lastAddedItem.properties.push({
            name: modifier.title,
            value: value.toString(),
          });
        }
      }
    });

    // Update the order items with the modified last item
    setThisOrderItems([
      ...thisOrderItems.slice(0, lastAddedItemIndex),
      lastAddedItem,
    ]);
    setCurrentTab(1);
    setTriggerButtonBuild((prev) => prev + 1);
    setModItems([]);
    setInputValues({});
  };

  useEffect(() => {
    // Check if the currently modifying item is still in the cart
    const isModifyingItemInCart =
      modifyingItemIndex !== null &&
      thisOrderItems[modifyingItemIndex] !== undefined;
    if (!isModifyingItemInCart) {
      // If the item has been removed, reset the form and related states
      setInputValues({});
      setModifyingItemIndex(null); // Or another logic to handle this situation
      setTriggerButtonBuild((prev) => prev + 1);
      //setCurrentTab(1);
      // Reset any other states related to the modifier form as necessary
    }
  }, [
    thisOrderItems,
    modifyingItemIndex,
    setInputValues,
    setModifyingItemIndex,
  ]); //track mod form

  const editMember = (member) => {
    // Format dob to YYYY-MM-DD
    const formattedMember = { ...member };
    setEditedMember(formattedMember);
    setIsEditMember(true);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditedMember((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSaveMember = (event) => {
    event.preventDefault();
    if (editedMember) {
      memberEditDetails(editedMember);
      setIsEditMember(false);
    }
  };

  const memberEditDetails = (editMemberProperties, preserve = false) => {
    const editMemberPropertiesFiltered = {
      membership_number: editMemberProperties.membership_number,
      dob: editMemberProperties.dobstring,
      name: editMemberProperties.name,
      membership_type: editMemberProperties.membership_type,
      barcode: editMemberProperties.barcode,
      sub_id: editMemberProperties.sub_id,
      valid_until: editMemberProperties.valid_until_string,
      alert: editMemberProperties.alert,
    };

    // Construct the body of the request
    const requestBody = JSON.stringify(editMemberPropertiesFiltered);
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
        if (!preserve) {
          //look in the members array, find the returned member, and update the member object for them
          const memberIndex = members.findIndex(
            (member) => member.membership_number === data.membership_number
          );
          if (memberIndex !== -1) {
            const updatedMembers = [...members];
            const updatedMember = { ...members[memberIndex], ...data };
            updatedMembers[memberIndex] = updatedMember;
            setMembers(updatedMembers);
          }
        }
        // Handle success - e.g., update UI or state
      })
      .catch((error) => {
        toast.error("Error editing member:" + error);
        // Handle error - e.g., show error message to user
      });
  };

  const addMemberBarcode = (e: React.FormEvent, member) => {
    e.preventDefault();
    setIsAddBarcode(true);
    setSelectedMember(member);
  };

  useEffect(() => {
    //build buttons from buttonlist
    const openPopupWindow = (url, windowName, windowFeatures) => {
      window.open(url, windowName, windowFeatures);
    };

    const newbuttons: JSX.Element[] = [];
    for (let j = 0; j < buttonlist.length; j++) {
      const btn = buttonlist[j];
      const photo = btn.photo || "";
      const isExpired = (() => {
        const expiry = new Date(btn?.valid_until);
        expiry.setHours(23, 59, 59, 999);
        return expiry < new Date();
      })();

      newbuttons.push(
        <div
          key={"buttondiv-" + j}
          id={"buttondiv-" + j}
          onContextMenu={(e) => handleRightClick(e, btn)}
          className={`${btn.title ? "button" : "emptybutton"} ${
            isExpired ||
            new Date(btn?.valid_starting) > new Date() ||
            btn?.redeemed
              ? " inactive"
              : ""
          } ${isDelete ? " isDelete" : ""}
          ${
            btn.isModifierMod
              ? " modmod-button"
              : btn.isMod
              ? " mod-button"
              : ""
          }
          ${btn.kds_enabled ? " kds-enabled" : ""} ${
            btn.kds_fulfillable ? " kds-fulfillable" : ""
          }
          ${btn.kds_station ? btn.kds_station : "no_station"}
						`}
          style={{
            gridArea: `${buttonarea[j]}`,
            backgroundImage: photo ? `url(${photo})` : "none",
            backgroundSize: photo ? "cover" : "", // or 'contain' based on your requirement
            backgroundPosition: "center",
          }}
          data-index={j} // Store the index of the button
        >
          {buttonlist.length != 1 && btn.membership_type && (
            <span
              className="edit-member"
              onClick={() => searchMembers(btn.membership_number)}
            >
              Details
            </span>
          )}
          {btn.membership_type && !btn.barcode && (
            <span
              className="add-barcode"
              onClick={(e) => {
                e.preventDefault(); // prevent the default behavior of the click event
                e.stopPropagation(); // Stop the event from bubbling up to parent elements
                addMemberBarcode(e, btn);
              }}
            >
              Add Barcode
            </span>
          )}
          {buttonlist.length == 1 && btn.membership_type && (
            <React.Fragment key={btn.id || btn.plu_id}>
              <span className="edit-member" onClick={() => editMember(btn)}>
                Edit
              </span>
              {(btn.email || btn.sub_id) && (
                <span
                  className="all-members"
                  onClick={() => searchMembers(btn.email || btn.sub_id)}
                >
                  View All
                </span>
              )}
            </React.Fragment>
          )}
          {buttonlist.length == 1 && btn.membership_type && (
            <span
              className="new-photo"
              onClick={() => {
                setSelectedMember(btn);
                setShowPhotoUploadForm(true);
              }}
            >
              New Photo
            </span>
          )}
          <span
            key={"button-" + j}
            className={`buttontext 
              ${photo ? "image" : ""} 
              ${btn.membership_type?.includes("Premium") ? " premium" : ""}
              ${
                new Date(btn?.valid_until) < new Date() ||
                new Date(btn?.valid_starting) > new Date() ||
                btn?.redeemed
                  ? "expired"
                  : ""
              }
              `}
            lang="en"
            id={"button-" + j}
          >
            {btn.name || btn.title || ""}
            {btn.redeemed ? (
              <p className="alert">
                <br />
                Already Redeemed on
                <br />
                {new Date(btn.redeemed).toLocaleString()}
              </p>
            ) : (
              ""
            )}
            {isExpired ? (
              btn.sub_id ? (
                <p className="alert">
                  {btn.membership_type}
                  <br />
                  Payment Due
                  <br />
                  {new Date(btn.valid_until).toLocaleString()}
                </p>
              ) : (
                <p className="alert">
                  {btn.membership_type}
                  <br />
                  <b>Expired on {btn.valid_until.toLocaleDateString()}</b>
                </p>
              )
            ) : (
              ""
            )}
            {btn?.valid_starting > new Date() ? (
              <p className="alert">
                {btn.membership_type}
                <br />
                <b>Not Valid until {btn.valid_starting.toLocaleDateString()}</b>
              </p>
            ) : (
              ""
            )}
            {btn.visitsToday == 1 &&
            isBFF &&
            btn.membership_type.includes("Premium") ? (
              <p className="bffAlert">BFF Available</p>
            ) : (
              ""
            )}
            {btn.currentVisits > 0 ? (
              <p className="alert">Already Included in This Order</p>
            ) : btn.visitsToday > 0 ? (
              <p className="alert">Already Checked In Today</p>
            ) : (
              ""
            )}
            {btn.visitsToday == 2 ? (
              <p className="alert">BFF Already Checked In</p>
            ) : (
              ""
            )}
            {buttonlist.length == 1 && btn.membership_type && (
              <React.Fragment key={btn.id || btn.plu_id}>
                {btn.membership_type && (
                  <React.Fragment
                    key={(btn.id || btn.plu_id) + "membership_type"}
                  >
                    <br />
                    {btn.membership_type}
                  </React.Fragment>
                )}
                {btn.valid_starting && (
                  <React.Fragment
                    key={(btn.id || btn.plu_id) + "valid_starting"}
                  >
                    <br />
                    Valid Starting: {btn.valid_starting.toLocaleDateString()}
                  </React.Fragment>
                )}
                {btn.valid_until && (
                  <React.Fragment key={(btn.id || btn.plu_id) + "valid_until"}>
                    <br />
                    Valid Until: {btn.valid_until.toLocaleDateString()}
                  </React.Fragment>
                )}
                {btn.next_payment && (
                  <React.Fragment key={(btn.id || btn.plu_id) + "next_payment"}>
                    <br />
                    Next Payment Due: {btn.next_payment.toLocaleDateString()}
                  </React.Fragment>
                )}
                {btn.dob && (
                  <React.Fragment key={(btn.id || btn.plu_id) + "dob"}>
                    <br />
                    DOB: {btn.dob.split("T")[0]}
                  </React.Fragment>
                )}
                {btn.signup_date && (
                  <React.Fragment key={(btn.id || btn.plu_id) + "signup_date"}>
                    <br />
                    Member Since: {btn.signup_date.toLocaleDateString()}
                  </React.Fragment>
                )}

                {btn.payments_remaining && (
                  <React.Fragment
                    key={(btn.id || btn.plu_id) + "payments_remaining"}
                  >
                    <br />
                    Required Payments Remaining: {btn.payments_remaining}
                  </React.Fragment>
                )}

                {btn.payment_amount && (
                  <React.Fragment
                    key={(btn.id || btn.plu_id) + "payment_amount"}
                  >
                    <br />
                    Payment Amount: ${btn.payment_amount}
                  </React.Fragment>
                )}

                {btn.totalPaid > 0 && btn.totalPaid && (
                  <React.Fragment key={(btn.id || btn.plu_id) + "totalPaid"}>
                    <br />
                    Total Paid: ${btn.totalPaid}
                  </React.Fragment>
                )}

                {btn.last_visit && (
                  <React.Fragment key={(btn.id || btn.plu_id) + "last_visit"}>
                    <br />
                    Last visit: {btn.last_visit.toLocaleString()}
                  </React.Fragment>
                )}

                {btn.visits && (
                  <React.Fragment key={(btn.id || btn.plu_id) + "visits"}>
                    <br />
                    Total Visits: {btn.visits}
                  </React.Fragment>
                )}

                {btn.visits && btn.totalPaid && (
                  <React.Fragment
                    key={(btn.id || btn.plu_id) + "paid_per_visit"}
                  >
                    <br />
                    Paid Per Visit:{" "}
                    {Math.round((btn.totalPaid / btn.visits) * 100) / 100}
                  </React.Fragment>
                )}

                {btn.edit_url && (
                  <React.Fragment key={(btn.id || btn.plu_id) + "edit_url"}>
                    <br />
                    <br />
                    <span
                      onClick={() =>
                        openPopupWindow(
                          btn.edit_url,
                          "newWindow",
                          "width=800,height=600"
                        )
                      }
                    >
                      View Subscription Portal
                    </span>
                  </React.Fragment>
                )}
              </React.Fragment>
            )}
            {btn.membership_type && btn.alert && (
              <React.Fragment key={(btn.id || btn.plu_id) + "alert"}>
                <br />
                <span className="member-alert">ALERT: {btn.alert}</span>
              </React.Fragment>
            )}
            {btn.price > 0 ? (
              <React.Fragment key={btn.plu_id + "price"}>
                <br />
                <span className="buttonprice" id={"buttonprice-" + j}>
                  {btn.discountType == "%"
                    ? `-${btn.price}%`
                    : `$${btn.price.toFixed(2)}`}
                </span>
              </React.Fragment>
            ) : (
              ""
            )}
            {btn.subtitle ? (
              <React.Fragment key={btn.plu_id + "subtitle"}>
                <br />
                <span className="buttonsubtotal" id={"buttonsubtitle-" + j}>
                  {btn.subtitle}
                </span>
              </React.Fragment>
            ) : (
              ""
            )}
            {btn.date ? (
              <React.Fragment key={btn.plu_id + "date"}>
                <br />
                <span className="buttonsubtotal" id={"buttondate-" + j}>
                  Order Placed: {btn.date}
                </span>
              </React.Fragment>
            ) : (
              ""
            )}
          </span>
        </div>
      );
    }
    if (currentTab != 8) setButtons(newbuttons); //create buttons[] from buttonlist
    //end grid creation
  }, [buttonlist, triggerButtonBuild, isDelete]);

  //function addItem(e){
  type SoundName =
    | "add"
    | "block1"
    | "block2"
    | "bloop1"
    | "bloop2"
    | "bloop3"
    | "chaching"
    | "pop1"
    | "pop2"
    | "pop3"
    | "pop4"
    | "pop5"
    | "pop6"
    | "pop7"
    | "pop8"
    | "pop9";

  async function addItem(itemOrEvent) {
    let sound: SoundName = "pop7";
    let newItem: Types.ExtendedLineItem;
    if (itemOrEvent && itemOrEvent.target) {
      // Handle MouseEvent as before
      const target = itemOrEvent.target;
      const id = target.id.split("-")[1];
      if (!id) return;
      newItem = structuredClone(buttonlist[parseInt(id, 10)]);
    } else {
      // Handle object directly
      newItem = structuredClone(itemOrEvent); // Assume itemOrEvent is the object with item details
    }
    if (newItem.price < 0) {
      newItem.price = Math.abs(newItem.price);
      newItem.quantity = -(Math.abs(newItem.quantity) || 1);
    }
    let newOrder = [];

    if (orderId) {
      await new Promise((resolve) => {
        const clearOrderPromise = clearOrder(true, false);
        clearOrderPromise.then(() => {
          resolve(true);
        });
      });
    } else {
      newOrder = [...thisOrderItems.map((item) => ({ ...item }))]; // clone defensively
    }

    if (newItem.membership_type) {
      if (newItem.membership_type.includes("Premium")) {
        sound = "bloop3";
        //check if discountCodes contains a premium discount code and add it if not
        if (!discountCodes.find((dc) => dc.code.includes("PREMIUM"))) {
          setDiscountCodes([
            ...discountCodes,
            {
              code: "PREMIUM",
              amount: 20,
              type: "percentage",
            },
          ]);
        }
      } else {
        sound = "bloop1";
      }
      if (
        !customer.email &&
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(newItem.email)
      ) {
        setCustomer({
          first_name: newItem.name || "No Name Provided",
          email: newItem.email,
        });
      }
    }

    if (newItem.membership_type && newItem.photo == nophoto) {
      if (newItem.photo == nophoto) {
        // If the member has no photo, set the selected member and show the upload form
        setSelectedMember(newItem);
        setShowPhotoUploadForm(true);
      } else {
        // Otherwise, proceed with your existing logic (e.g., showing member details)
        searchMembers(newItem.membership_number);
      }
    }

    if (
      new Date(new Date(newItem?.valid_until).setHours(23, 59, 59, 999)) <
        new Date() ||
      newItem?.valid_starting > new Date()
    ) {
      soundManager.play("block1");
      return;
    }
    if (newItem.visitsToday == 1) {
      if (isBFF && newItem.title.includes("Premium")) {
        newItem.title = `BFF Checkin`;
        newItem.attendance_category = "BFF";
        newItem.calendar_category = null;
        sound = "bloop2";
      } else {
        soundManager.play("block1");
        //('already checked in')
        return;
      }
    } else if (newItem.visitsToday > 1) {
      soundManager.play("block1");
      return;
    }

    let matchedIndex = -1;

    if (newItem.function == "searchOrders") {
      return searchOrders(`id=${newItem.barcode}`);
      //searchOrders(newItem.title);
    } //if search function button
    if (newItem.email || newItem.sub_id) {
      searchMembers(newItem.email || newItem.sub_id);
      //setSubSearch(newItem.sub_id)
    } //if member, find related members for suggestions
    if (!newItem.title && !newItem.name) {
      soundManager.play("block1");
      return;
    } //exit if not a plu item button
    if (/^-?\d+$/.test(typedValue)) {
      newItem.quantity = parseInt(typedValue, 10);
      if (newItem.quantity < 10000) {
        setTypedValue("");
      } else {
        newItem.quantity = 1;
      }
      if (newItem.max_quantity && newItem.max_quantity < newItem.quantity) {
        newItem.quantity = newItem.max_quantity;
      }
    } //set quantity if number is typed
    //if the delete key is being held down, make the quantity negative
    if (isDelete) {
      newItem.quantity = -(Math.abs(newItem.quantity) || 1);
    }

    //test if typedValue is in the form 300*2299 or 5x1299 for custom rates on item
    if (
      newItem.function?.includes("customrate") &&
      /^[-\d]+([*x])(\d+(?:\.\d+)?)$/.test(typedValue)
    ) {
      newItem.quantity = parseFloat(typedValue.split(/[*x]/)[0]);

      if (newItem.quantity < 100000) {
        setTypedValue("");
      } else {
        newItem.quantity = 1;
      }
      if (newItem.max_quantity && newItem.max_quantity < newItem.quantity) {
        newItem.quantity = newItem.max_quantity;
      }
      const ratestring = typedValue.split(/[*x]/)[1];
      //let rate = typedValue.split(/[*x]/)[1]
      //if it doesn't have a decimal, divide by 100
      let rate = 0;
      if (!/\./.test(ratestring)) {
        if (Number(ratestring) < 1) {
          rate = Number(ratestring);
        } else {
          rate = Number(ratestring) / 100;
        }
      } else {
        rate = Number(ratestring);
      }

      newItem.price = rate;
      newItem.fullPrice = rate;
    } else {
      newItem.fullPrice = newItem.price;
    }
    if (
      currentTab !== 10 &&
      newItem.modClass &&
      newItem.modClass > 999 &&
      Math.floor(newItem.modClass / 1000) != modClass
    ) {
      soundManager.play("block1");

      return;
    } //if item has mods and the mods it needs are not loaded
    setNumOfMods(
      (prevNumOfMods) =>
        Math.max(prevNumOfMods - 1, 0) + (newItem.numOfMods || 0)
    );

    if (
      !newItem.isMod ||
      Math.floor(newItem.modClass / 1000) === modClass ||
      newItem.function == "swap"
    ) {
      setModClass(newItem.modClass % 1000 || null);
      if (newItem.modClass % 1000 === 0) {
        setParentModClass(null);
      }
    }

    if (!newItem.isMod || newItem.function == "swap") {
      setParentModClass(newItem.modClass || 0);
    }
    setModUpdateTrigger((prev) => !prev);
    setAllMods(
      (newItem.required_mods || []).concat(newItem.optional_mods || [])
    );

    const modsToFetchArray = (newItem.required_mods || []).concat(
      newItem.optional_mods || []
    );
    // Remove duplicates
    const uniqueModsToFetchArray = [...new Set(modsToFetchArray)];

    // Check which mod classes are not in the cache
    if (!newItem.isMod || newItem.function == "swap") {
      const cachedMods = uniqueModsToFetchArray.flatMap((modClassId) => {
        const mods = modClassesData[modClassId] || [];
        return mods.map((mod) => structuredClone(mod));
      });
      setModItems(cachedMods);
    }

    if (newItem.function == "addmods") {
      const modClassIds = [
        ...new Set(
          uniqueModsToFetchArray.concat(modItems.map((mod) => mod.mod))
        ),
      ];
      console.log("modClassIds:", modClassIds);
      const cachedMods = modClassIds.flatMap((modClassId) => {
        const mods = modClassesData[modClassId] || [];
        return mods.map((mod) => structuredClone(mod));
      });
      console.log("cachedMods:", cachedMods);
      setModItems(cachedMods);
    }

    if (newItem.isMod) {
      addModifierToItem(newItem, newOrder);
      soundManager.play("pop1");
    } else {
      setModifierModItems([]);
      const compareItems = (
        item1: Types.ExtendedLineItem,
        item2: Types.ExtendedLineItem
      ) => {
        if (newItem.category?.toLowerCase() == "food") {
          return false;
        }
        const cloneItem = (item: Types.ExtendedLineItem) => {
          const { quantity, photo, ...rest } = item;
          return JSON.stringify(rest);
        };
        return cloneItem(item1) === cloneItem(item2);
      };
      for (let i = 0; i < newOrder.length; i++) {
        if (compareItems(newItem, newOrder[i])) {
          if (
            newItem.max_quantity &&
            newOrder[i].quantity + newItem.quantity > newItem.max_quantity
          ) {
            newItem.quantity = 0;
          }
          newOrder[i] = {
            ...newOrder[i],
            quantity: newOrder[i].quantity + newItem.quantity,
          }; // Create a new object with updated quantity
          matchedIndex = i;
          break;
        }
      } //add to quantity if already exists
      if (matchedIndex !== -1) {
        const matchedItem = newOrder.splice(matchedIndex, 1)[0]; // remove the matched item
        newOrder.push(matchedItem); // add it back to the end
      } else {
        newOrder.push(newItem); // if no match, simply add the new item to the end
      }
      // Look for the item in the existing order
      const itemIndex = newOrder.findIndex((item) => item === newItem);
      // If the item exists, set it as the current modifying item
      if (itemIndex !== -1) {
        setModifyingItemIndex(itemIndex);
      }
      setThisOrderItems(newOrder);
      soundManager.play(sound);
    }
  }

  function addModifierToItem(
    modifier: Types.ExtendedLineItem,
    newOrder: Types.LineItem[]
  ) {
    if (modifyingItemIndex !== null) {
      const currentItem: Types.ExtendedLineItem = newOrder[modifyingItemIndex];
      const modMods = [];
      modMods.push(...(modifier.optional_mods || []));
      modMods.push(...(modifier.required_mods || []));

      const uniqueModsToFetchArray = [...new Set(modMods)];

      if (modifier.id) {
        currentItem.id = modifier.id;
      }
      if (modifier.variant_id) {
        currentItem.variant_id = modifier.variant_id;
      }
      if (modifier.discountType) {
        let discAmt = 0;
        if (modifier.discountType == "%") {
          discAmt = parseFloat(
            ((currentItem.price * modifier.price) / 100).toFixed(2)
          );
          modifier.price = discAmt * -1;
        } else if (modifier.discountType == "$") {
          discAmt = parseFloat(modifier.price.toFixed(2));
          modifier.price = discAmt * -1;
        } else if (modifier.discountType == "o") {
          discAmt = parseFloat((currentItem.price - modifier.price).toFixed(2));
          modifier.price = discAmt * -1;
        }
      }

      if (!currentItem.properties) {
        currentItem.properties = [];
      }

      if (modifier.isModifierMod) {
        const lastProperty =
          currentItem.properties[currentItem.properties.length - 1];
        if (modifier.function == "prefix") {
          if (
            lastProperty &&
            lastProperty.value &&
            !lastProperty.value.startsWith(modifier.title)
          ) {
            lastProperty.value = modifier.title + " " + lastProperty.value;
            lastProperty.addPrice = `${modifier.price}`;
            lastProperty.modClass = modifier.modClass || null;
            lastProperty.kds_enabled = modifier.kds_enabled;
            currentItem.price = currentItem.price + modifier.price;
            lastProperty.modMods = uniqueModsToFetchArray;
            lastProperty.category =
              modifier.category || lastProperty.category || null;
          }
        } else {
          if (
            lastProperty &&
            lastProperty.value &&
            !lastProperty.value.endsWith(modifier.title)
          ) {
            lastProperty.value = lastProperty.value + " " + modifier.title;
            lastProperty.addPrice = `${modifier.price}`;
            lastProperty.modClass = modifier.modClass || null;
            lastProperty.kds_enabled = modifier.kds_enabled;
            currentItem.price = currentItem.price + modifier.price;
            lastProperty.category =
              modifier.category || lastProperty.category || null;
          }
        }
      } else {
        if (
          modifier.function == "overwrite" ||
          modifier.function == "suffix" ||
          modifier.function == "prefix" ||
          modifier.function == "swap"
        ) {
          let oldTitle = currentItem.title;
          if (modifier.function === "swap") {
            let kds = currentItem.kds_enabled;
            let kdsFulfillable = currentItem.kds_fulfillable;
            let kdsStation = currentItem.kds_station;
            currentItem.kds_enabled = modifier.kds_enabled;
            currentItem.kds_fulfillable = modifier.kds_fulfillable;
            currentItem.kds_station = modifier.kds_station;
            currentItem.title = modifier.title;
            currentItem.modClass = modifier.modClass || null;
            currentItem.optional_mods = modifier.optional_mods || null;
            currentItem.required_mods = modifier.required_mods || null;
            currentItem.category =
              modifier.category || currentItem.category || null;
            currentItem.properties.push({
              name: "Mod",
              value: oldTitle,
              kds_enabled: kds,
              kds_fulfillable: kdsFulfillable,
              kds_station: kdsStation,
            });
          } else if (modifier.function === "overwrite") {
            currentItem.title = modifier.title;
            currentItem.kds_enabled = modifier.kds_enabled;
            currentItem.kds_station = modifier.kds_station;
            currentItem.kds_fulfillable = modifier.kds_fulfillable;
            currentItem.category =
              modifier.category || currentItem.category || null;
          } else if (
            modifier.function === "prefix" &&
            !currentItem.title.startsWith(modifier.title)
          ) {
            currentItem.title = `${modifier.title} ${currentItem.title}`;
          } else if (
            modifier.function === "suffix" &&
            !currentItem.title.endsWith(modifier.title)
          ) {
            currentItem.title = `${currentItem.title} ${modifier.title}`;
            currentItem.category =
              modifier.category || currentItem.category || null;
          }
          currentItem.price = modifier.price + currentItem.price;
          currentItem.fullPrice = currentItem.price;
          currentItem.sku = modifier.sku;
          currentItem.kds_station =
            modifier.kds_station || currentItem.kds_station;
          currentItem.kds_enabled =
            modifier.kds_enabled || currentItem.kds_enabled;
          if (modifier.quantity < 0) {
            currentItem.quantity = -currentItem.quantity;
          }
          //currentItem.quantity = modifier.quantity;
        } else {
          if (modifier.discountType) {
            if (modifier.discountType == "%") {
              currentItem.properties.push({
                name: "Mod",
                value: `${modifier.title} (-$${Math.abs(modifier.price).toFixed(
                  2
                )})`,
                modClass: modifier.modClass || null,
                addPrice: `${modifier.price}`,
                kds_enabled: false,
                modMods: uniqueModsToFetchArray,
              });
              currentItem.price += modifier.price;
            } else if (modifier.discountType == "$") {
              currentItem.properties.push({
                name: "Mod",
                value: `${modifier.title} (-$${Math.abs(modifier.price).toFixed(
                  2
                )})`,
                modClass: modifier.modClass || null,
                addPrice: `${modifier.price}`,
                kds_enabled: false,
                modMods: uniqueModsToFetchArray,
              });
              currentItem.price += modifier.price;
            } else if (modifier.discountType == "o") {
              currentItem.properties.push({
                name: "Mod",
                value: `${modifier.title} (-$${Math.abs(modifier.price).toFixed(
                  2
                )})`,
                modClass: modifier.modClass || null,
                addPrice: `${modifier.price}`,
                kds_enabled: false,
                modMods: uniqueModsToFetchArray,
              });
              currentItem.price += modifier.price;
            }
          } else if (modifier.addPrice) {
            currentItem.properties.push({
              name: "Mod",
              value: `${modifier.title}`,
              modClass: modifier.modClass || null,
              addPrice: `${modifier.price}`,
              kds_enabled: modifier.kds_enabled || false,
              kds_station: modifier.kds_station || null,
              kds_fulfillable: modifier.kds_fulfillable || false,
              modMods: uniqueModsToFetchArray,
              category: modifier.category || null,
            });
            currentItem.price += modifier.price;
          } else
            currentItem.properties.push({
              name: "Mod",
              value: `${modifier.title}`,
              modClass: modifier.modClass || null,
              addPrice: `${modifier.price}`,
              kds_enabled: modifier.kds_enabled || false,
              kds_station: modifier.kds_station || null,
              kds_fulfillable: modifier.kds_fulfillable || false,
              modMods: uniqueModsToFetchArray,
              category: modifier.category || null,
            });
        }
      }

      // All mods are in cache (including those with empty arrays)
      const cachedMods = uniqueModsToFetchArray.flatMap((modClass) => {
        const mods = modClassesData[modClass] || [];
        return mods.map((mod) => ({ ...mod })); // Clone mods to prevent mutation
      });

      //for each cached mod, set isModifierMod to true
      cachedMods.forEach((mod) => {
        mod.isModifierMod = true;
      });

      setModifierModItems(cachedMods);
      setThisOrderItems(newOrder);
    }
  }

  const handleBarcodeSubmit = async (event) => {
    event.preventDefault();
    // Assuming `selectedPLUItem` holds the necessary item data, like an ID
    const pluItemId = contextMenu.currentItem?.sku || ""; // Ensure you have an 'id' or similar identifier

    const apiUrl = "/api/create-barcode"; // Your actual API endpoint
    const payload = {
      plu_id: pluItemId, // or any other identifier for the PLU item
      barcode: barcode,
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`, // if you need authentication
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        // Perform any follow-up actions like updating the UI or state
        setShowBarcodeModal(false);
        setBarcode(""); // Reset the barcode input
      } else {
        // Handle errors
        const error = await response.json();
        toast.error("Error adding barcode:" + error);
      }
    } catch (error) {
      toast.error("Network error:" + error);
    }
  };

  const addBarcode = (item) => {
    // Implement your logic to add a barcode here (e.g., show a form modal)
    setShowBarcodeModal(true);
    setContextMenu({ visible: false, x: 0, y: 0, currentItem: item }); // Close context menu
  };

  const handleEnterPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent the form from submitting
      const formElements = e.target.form.elements; // Get all form elements
      const currentIndex = Array.prototype.indexOf.call(formElements, e.target);

      // Move focus to the next input
      const nextElement = formElements[currentIndex + 1];
      if (nextElement instanceof HTMLElement) {
        nextElement.focus();
      }
    }
  };

  useEffect(() => {
    if (mode === "kitchen" && ![3, 11, 5, 8, 10].includes(currentTab)) {
      setCurrentTab(3); // Redirect to Food tab
    }
  }, [currentTab, mode]); //tab permission check

  return (
    <div key="buttongrid" className="ButtonGrid" onClick={addItem}>
      <div className="tabs" style={{ gridArea: "1 / 1 / 41 / 421" }}>
        <React.Fragment key="tabs">
          {/* Only show Admission and Merch tabs if user has front access */}
          {mode === "front" && (
            <React.Fragment key="admission-merch">
              <button
                className={`tab-button ${currentTab === 1 ? "active" : ""}`}
                onClick={() => setCurrentTab(1)}
              >
                Admission
              </button>
              <button
                className={`tab-button ${currentTab === 2 ? "active" : ""}`}
                onClick={() => setCurrentTab(2)}
              >
                Merch
              </button>
            </React.Fragment>
          )}
          {/* Food and Drinks tabs are accessible to all users */}
          <button
            className={`tab-button ${currentTab === 3 ? "active" : ""}`}
            onClick={() => setCurrentTab(3)}
          >
            Food
          </button>
          <button
            className={`tab-button ${currentTab === 11 ? "active" : ""}`}
            onClick={() => setCurrentTab(11)}
          >
            Drinks
          </button>
          {modClass > 0 && (
            <button
              className={`tab-button ${currentTab === 5 ? "active" : ""}`}
              onClick={() => {
                setCurrentTab(5);
              }}
            >
              Item Modifiers
            </button>
          )}
          <button
            className={`tab-button ${currentTab === 10 ? "active" : ""}`}
            onClick={() => setCurrentTab(10)}
          >
            Modifiers
          </button>
        </React.Fragment>
        {/* Only show other tabs if user has front access */}
        {mode === "front" && (
          <React.Fragment key="other-tabs">
            {orderSearchResults.length >= 1 && (
              <button
                className={`tab-button ${currentTab === 6 ? "active" : ""}`}
                onClick={() => setCurrentTab(6)}
              >
                Order Search
              </button>
            )}
            {members.length > 0 && (
              <button
                className={`tab-button ${currentTab === 7 ? "active" : ""}`}
                onClick={() => setCurrentTab(7)}
              >
                Member Search
              </button>
            )}

            {giftCards.length > 0 && (
              <button
                className={`tab-button ${currentTab === 9 ? "active" : ""}`}
                onClick={() => setCurrentTab(9)}
              >
                Gift Cards
              </button>
            )}
          </React.Fragment>
        )}
      </div>
      {showBarcodeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBarcodeSubmit(e);
                setShowBarcodeModal(false);
              }}
            >
              <label htmlFor="barcode">Barcode:</label>
              <input
                id="barcode"
                type="text"
                ref={barcodeModalInputRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
              <button type="submit">Add Barcode</button>
              <button type="button" onClick={() => setShowBarcodeModal(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
      {isAddBarcode && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                //const { name, membership_type, dob, sub_id, barcode, membership_number } = req.body;
                const requestBody = JSON.stringify({
                  membership_number: selectedMember?.membership_number,
                  barcode: barcode,
                  dob: selectedMember?.dobstring,
                  membership_type: selectedMember?.membership_type,
                  sub_id: selectedMember?.sub_id,
                  name: selectedMember?.name,
                  valid_until: selectedMember?.valid_until_string,
                  alert: selectedMember?.alert,
                });

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
                    // Handle success - e.g., update UI or state
                  })
                  .catch((error) => {
                    toast.error("Error editing member:" + error);
                    // Handle error - e.g., show error message to user
                  });
                setIsAddBarcode(false);
                //search through current buttons for the member we just edited and update the barcode property
                const editedMemberIndex = buttonlist.findIndex(
                  (member) =>
                    member.membership_number ===
                    selectedMember?.membership_number
                );
                const updatedButtonList = [...buttonlist];
                updatedButtonList[editedMemberIndex] = {
                  ...updatedButtonList[editedMemberIndex],
                  barcode,
                };
                setButtonlist(updatedButtonList);
                setBarcode("");
                setTriggerButtonBuild((prev) => prev + 1);
              }}
            >
              <label htmlFor="barcode">Barcode:</label>
              <input
                id="barcode"
                ref={addMemberBarcodeInputRef} 
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
              <button type="submit">Add Barcode</button>
              <button type="button" onClick={() => setIsAddBarcode(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          <ul>
            <li
              onClick={() => {
                addBarcode(contextMenu.currentItem);
              }}
            >
              Add Barcode
            </li>
            <li
              onClick={() => {
                // Set the item to modify and open the modify modal.
                console.log("item to modify:", contextMenu.currentItem);
                setItemToModify(contextMenu.currentItem);
                setShowModifyModal(true);
                setContextMenu({
                  visible: false,
                  x: 0,
                  y: 0,
                  currentItem: null,
                });
              }}
            >
              Modify Item
            </li>
            {!contextMenu.currentItem?.line_item_id && (
              <li
                onClick={() => {
                  setShowShopifyConnector(true);
                  setContextMenu({
                    visible: false,
                    x: 0,
                    y: 0,
                    currentItem: contextMenu.currentItem,
                  });
                }}
              >
                Connect Shopify Item
              </li>
            )}
            {!contextMenu.currentItem?.line_item_id && (
              <li
                onClick={() => {
                  setItemToModify(contextMenu.currentItem);
                  setNewShopifyValues({
                    title: contextMenu.currentItem.title,
                    price: contextMenu.currentItem.original_unit_price,
                    sku: contextMenu.currentItem.sku,
                    vendor: contextMenu.currentItem.category,
                  });
                  setShowCreateShopifyModal(true);
                  setContextMenu({
                    visible: false,
                    x: 0,
                    y: 0,
                    currentItem: null,
                  });
                }}
              >
                Create Shopify Item
              </li>
            )}
          </ul>
        </div>
      )}
      {isEditMember && editedMember && (
        <React.Fragment key="edit-member">
          <div
            className="modal-overlay"
            onClick={() => setIsEditMember(false)}
          ></div>
          <div className="modal-content">
            <div className="">
              <h1>Edit Membership Details</h1>
              <form onSubmit={handleSaveMember}>
                <label>
                  Name:
                  <input
                    type="text"
                    name="name"
                    value={editedMember.name || ""}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleEnterPress(e)}
                  />
                </label>
                <br />
                <label>
                  Membership Type:
                  <input
                    type="text"
                    name="membership_type"
                    value={editedMember.membership_type || ""}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleEnterPress(e)}
                  />
                </label>
                <br />
                <label>
                  Date of Birth:
                  <input
                    type="date"
                    name="dobstring"
                    value={editedMember.dobstring || ""}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleEnterPress(e)}
                  />
                </label>
                <br />
                <label>
                  Subscription ID:
                  <input
                    type="text"
                    name="sub_id"
                    value={editedMember.sub_id || ""}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleEnterPress(e)}
                  />
                </label>
                <br />
                <label>
                  Barcode:
                  <input
                    type="text"
                    name="barcode"
                    value={editedMember.barcode || ""}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleEnterPress(e)}
                  />
                </label>
                <br />
                <label>
                  Valid Until:
                  <input
                    type="date"
                    name="valid_until_string"
                    value={editedMember.valid_until_string || ""}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleEnterPress(e)}
                  />
                </label>
                <br />
                <label>
                  Alert:
                  <input
                    type="text"
                    name="alert"
                    value={editedMember.alert || ""}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleEnterPress(e)}
                  />
                </label>
                <br />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setIsEditMember(false)}>
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </React.Fragment>
      )}
      {showPhotoUploadForm && selectedMember && (
        <PhotoUploadForm
          selectedMember={selectedMember}
          onClose={() => {
            setShowPhotoUploadForm(false);
          }}
          setMembers={setMembers}
          members={members}
        />
      )}
      {showModifyModal && itemToModify && (
        <div
          className="modal-overlay"
          onClick={() => setShowModifyModal(false)} // Clicking outside closes the modal
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Modify Item</h2>
            <form onSubmit={handleModifySubmit}>
              <label>
                Title:
                <input
                  type="text"
                  value={modifyValues.title}
                  onChange={(e) =>
                    setModifyValues({ ...modifyValues, title: e.target.value })
                  }
                />
              </label>
              <br />
              <label>
                Price:
                <input
                  type="number"
                  step="0.01"
                  ref={modifyBarcodeInputRef}
                  value={modifyValues.original_unit_price}
                  onChange={(e) =>
                    setModifyValues({
                      ...modifyValues,
                      original_unit_price: parseFloat(e.target.value),
                    })
                  }
                />
              </label>
              <br />
              <label>
                KDS Station:
                <input
                  type="text"
                  value={modifyValues.kds_station}
                  onChange={(e) =>
                    setModifyValues({
                      ...modifyValues,
                      kds_station: e.target.value,
                    })
                  }
                />
              </label>
              <br />
              <label>
                KDS Enabled:
                <input
                  type="checkbox"
                  checked={modifyValues.kds_enabled}
                  onChange={(e) =>
                    setModifyValues({
                      ...modifyValues,
                      kds_enabled: e.target.checked,
                    })
                  }
                />
              </label>
              <br />
              <label>
                Shopify Variant ID:
                <input
                  type="number"
                  value={modifyValues.variant_id}
                  onChange={(e) =>
                    setModifyValues({
                      ...modifyValues,
                      variant_id: parseInt(e.target.value),
                    })
                  }
                />
              </label>
              <br />
              <label>
                Shopify Line Item ID:
                <input
                  type="number"
                  value={modifyValues.line_item_id}
                  onChange={(e) =>
                    setModifyValues({
                      ...modifyValues,
                      line_item_id: parseInt(e.target.value),
                    })
                  }
                />
              </label>
              <br />
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setShowModifyModal(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
      {showShopifyConnector && (
        <div
          className="modal-overlay"
          onClick={() => setShowShopifyConnector(false)}
        >
          <div
            className="shopify-connector"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Connect Shopify Item</h2>
            <input
              type="text"
              placeholder="Search Shopify products..."
              value={shopifyQuery}
              onChange={(e) => setShopifyQuery(e.target.value)}
            />
            <div className="shopify-search-results">
              {shopifyResults.map((result) => (
                <div key={result.id} className="shopify-result">
                  <p>{result.title}</p>
                  {result.variants.map((variant) => (
                    <div key={variant.id} className="variant-row">
                      <span>{variant.title}</span>
                      <button
                        onClick={() => {
                          const updated = {
                            ...contextMenu.currentItem,
                            line_item_id: result.id.split("/").pop(),
                            variant_id: variant.id.split("/").pop(),
                          };
                          console.log("updated item: ", updated);
                          setItemToModify(updated);
                          setShowModifyModal(true);
                          setShowShopifyConnector(false);
                        }}
                      >
                        Connect
                      </button>
                      <hr />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showCreateShopifyModal && itemToModify && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateShopifyModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create Shopify Product</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch("/api/create-shopify-item", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${sessionStorage.getItem(
                        "token"
                      )}`,
                    },
                    body: JSON.stringify({
                      ...newShopifyValues,
                    }),
                  });

                  if (!res.ok)
                    throw new Error("Failed to create Shopify product");
                  const data = await res.json();

                  // Update POS item with new Shopify IDs
                  await fetch("/api/modify-plu-item", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${sessionStorage.getItem(
                        "token"
                      )}`,
                    },
                    body: JSON.stringify({
                      id: itemToModify.plu_id,
                      variant_id: data.variant_id.split("/").pop() || null,
                      line_item_id: data.line_item_id.split("/").pop() || null,
                    }),
                  });

                  toast.success("Shopify item created and linked!");
                  setShowCreateShopifyModal(false);
                  setItemToModify(null);
                  //window.location.reload(); // or update locally if preferred
                } catch (err) {
                  toast.error("Error: " + err.message);
                }
              }}
            >
              <label>Title:</label>
              <input
                type="text"
                value={newShopifyValues.title}
                onChange={(e) =>
                  setNewShopifyValues((v) => ({ ...v, title: e.target.value }))
                }
              />
              <br />
              <label>Price:</label>
              <input
                type="number"
                step="0.01"
                value={newShopifyValues.price}
                onChange={(e) =>
                  setNewShopifyValues((v) => ({
                    ...v,
                    price: parseFloat(e.target.value),
                  }))
                }
              />
              <br />
              <label>SKU:</label>
              <input
                type="text"
                value={newShopifyValues.sku}
                onChange={(e) =>
                  setNewShopifyValues((v) => ({ ...v, sku: e.target.value }))
                }
              />
              <br />
              <label>Vendor / Category:</label>
              <input
                type="text"
                value={newShopifyValues.vendor}
                onChange={(e) =>
                  setNewShopifyValues((v) => ({ ...v, vendor: e.target.value }))
                }
              />
              <br />
              <button type="submit">Create</button>
              <button
                type="button"
                onClick={() => setShowCreateShopifyModal(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {buttons ? buttons : ""}
    </div>
  );
}
