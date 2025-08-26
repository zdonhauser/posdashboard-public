import React, { useEffect, useRef } from "react";
import { KDSOrder } from "./KDS";
import "./KDS.scss";

interface KdsOrderBlockProps {
  order: KDSOrder;
  handleOrderStatus: (orderId: number, status?: string) => void;
  restoreOrder: (orderId: number) => void;
  handleItemToggle: (itemId: number, status: string, orderId: number) => void;
	mode: "kitchen" | "pickup" | "front" | "recall";
}

const KdsOrderBlock: React.FC<KdsOrderBlockProps> = ({
	order,
	handleOrderStatus,
  handleItemToggle,
  restoreOrder,
	mode,
}) => {
  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const longPressActiveRef = useRef<boolean>(false);
  const [isLongPressActive, setIsLongPressActive] = React.useState(false); // for visual cue

  const isScrollingRef = useRef(false);
  const touchMoveListenerRef = useRef<(e: TouchEvent) => void>();
  const touchEndListenerRef  = useRef<(e: TouchEvent) => void>();
  const cancelLongPressOnMoveRef = useRef<(e: TouchEvent) => void>(); // NEW

  
  const calculateElapsedTime = (createdAt: string, updatedAt?: string): string => {
    const now = new Date();
    const createdTime = new Date(createdAt);
    let diff = now.getTime() - createdTime.getTime();

    if(updatedAt){
      const updatedTime = new Date(updatedAt);
      diff = updatedTime.getTime() - createdTime.getTime();
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num: number) => String(num).padStart(2, "0");
    if(hours == 0 && minutes == 0 && seconds == 0){
      return '--';
    } else if( hours == 0 && minutes == 0){
      return `${pad(seconds)}s`;
    } else if( hours == 0){
      return `${pad(minutes)}:${pad(seconds)}`;
    } else{
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
  };

  const [elapsedTime, setElapsedTime] = React.useState<string>(
    calculateElapsedTime(order.created_at)
  );

  const [completionTime, setCompletionTime] = React.useState<string>(
    calculateElapsedTime(order.created_at, order.updated_at)
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedTime(calculateElapsedTime(order.created_at));
    }, 1000);
  
    return () => clearInterval(intervalId);
  }, [order.created_at]);
  
  

  useEffect(() => {
    let lastKeyPressed: string | null = null;
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;
      if (!order.i) return;
      if (
        lastKeyPressed === key &&
        !isNaN(Number(key)) &&
        Number(key) == order.i
      ) {
        handleOrderStatus(order.id);
      }
      lastKeyPressed = key;
      setTimeout(() => {
        lastKeyPressed = null;
      }, 200);
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const oldestFirstItems = [...order.items].sort((a, b) => a.id - b.id);
  //const elapsedTime = calculateElapsedTime(order.created_at);

  const toggleItemStatus = (itemId: number, currentStatus: string) => {
    if (isScrollingRef.current) return; 
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    let newStatus: "pending" | "ready" | "fulfilled" = "ready";

    if (currentStatus === "ready") {
      if(mode === "pickup") newStatus = "fulfilled";
      else if(mode === "kitchen") return
    }
    if(currentStatus === "fulfilled") return
    handleItemToggle(itemId, newStatus, order.id);
  };

  const reverseToggleItemStatus = (itemId: number, currentStatus: string) => {
    let newStatus = "pending";
    if (currentStatus === "fulfilled") {
      newStatus = "ready";
    }
    handleItemToggle(itemId, newStatus, order.id);
  };

  const handleMouseDown = (itemId: number, currentStatus: string) => {
    startTimerRef.current = setTimeout(() => {
      reverseToggleItemStatus(itemId, currentStatus);
      longPressTriggeredRef.current = true;
      startTimerRef.current = null;
    }, 500);
  };

  const handleOrderLongPressStart = () => {
    if (order.status === "pending") return;
    // Start showing the visual cue at 250ms
    startTimerRef.current = setTimeout(() => {
      setIsLongPressActive(true);
      longPressActiveRef.current = true;
    }, 100);

    // Trigger the action at 500ms
    completeTimerRef.current = setTimeout(() => {
      restoreOrder(order.id);
      longPressTriggeredRef.current = true;

      // Let the visual cue persist a bit after the action (e.g., 250ms)
      setTimeout(() => {
        setIsLongPressActive(false);
        longPressActiveRef.current = false;
      }, 1000);

      startTimerRef.current = null;
      completeTimerRef.current = null;
    }, 1000);
  };

  const handleTouchStart = () => {
    isScrollingRef.current = false;
    handleOrderLongPressStart();
  
    cancelLongPressOnMoveRef.current = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        handleMouseUpOrLeave();
      }
    };
    window.addEventListener(
      "touchmove",
      cancelLongPressOnMoveRef.current,
      { passive: true }
    );
  };
  

  const handleTouchMove = (e: React.TouchEvent) => {
    isScrollingRef.current = true;
    handleMouseUpOrLeave();
  };

  const handleOrderClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    if (order.status !== "fulfilled") handleOrderStatus(order.id);
    else restoreOrder(order.id);
  };

  const handleMouseUpOrLeave = () => {
    if (startTimerRef.current)   clearTimeout(startTimerRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    startTimerRef.current = null;
    completeTimerRef.current = null;

    isScrollingRef.current = false;

    if (longPressActiveRef.current) {
      longPressActiveRef.current = false;
      setIsLongPressActive(false);
    }

    if (touchMoveListenerRef.current) {
      window.removeEventListener("touchmove", touchMoveListenerRef.current);
      touchMoveListenerRef.current = undefined;
    }
    if (touchEndListenerRef.current) {
      window.removeEventListener("touchend", touchEndListenerRef.current);
      touchEndListenerRef.current = undefined;
    }
    if (cancelLongPressOnMoveRef.current) {
      window.removeEventListener(
        "touchmove",
        cancelLongPressOnMoveRef.current
      );
      cancelLongPressOnMoveRef.current = undefined;
    }
  };

  return (
    <div
      className={`kds-order ${order.status} ${order.isFirst ? "first" : ""} ${
        order.isLast ? "last" : ""
      } ${!order.isFirst && !order.isLast ? "middle" : ""}`}
      key={order.id}
    >
      {order.isFirst && (
        <div className="order-header">
          {/*{order.i <= 9 && <span className="order-number">{order.i}</span>}*/}
          <h3
            className="order-number"
            onMouseDown={handleOrderLongPressStart}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
            onTouchCancel={handleMouseUpOrLeave}
            onContextMenu={(e) => e.preventDefault()}
            onClick={handleOrderClick}
          >
            {isLongPressActive && order.status !== "pending"
              ? "Hold to Mark Pending"
              : `${order.order_number.toString().slice(-3)}`}
          </h3>
          {order.name && (
            <h3
              className="name"
              onMouseDown={handleOrderLongPressStart}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
            onTouchCancel={handleMouseUpOrLeave}
            onContextMenu={(e) => e.preventDefault()}
            onClick={handleOrderClick}
          >
            {order.name || ""}
          </h3>
          )}
          {["ready", "fulfilled"].includes(order.status) ? (
            <b>{completionTime}</b>
          ) : (
            <i>{elapsedTime}</i>
          )}
        </div>
      )}

      <ul className="order-items">
        {oldestFirstItems.map((item) => {
          const status =
            item.prepared_quantity === item.quantity
              ? item.fulfilled_quantity === item.quantity
                ? "fulfilled"
                : "ready"
              : "pending";
          return (
            <li key={item.id}>
              <label
                style={{
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseDown={() => handleMouseDown(item.id, status)}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={() => handleMouseDown(item.id, status)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUpOrLeave}
                onTouchCancel={handleMouseUpOrLeave}
                onContextMenu={(e) => e.preventDefault()}
              >
                <input
                  type="checkbox"
                  checked={status !== "pending"}
                  readOnly
                  onChange={() => toggleItemStatus(item.id, status)}
                  className={`status-checkbox ${status}`}
                />
                <span
                  className={`station-${item.station} ${status}`}
                  style={{ marginLeft: "0.5rem" }}
                >
                  {item.quantity !== 1 ? item.quantity + " X " : ""}{" "}
                  {item.item_name}
                  {item.special_instructions && (
                    <div className="instructions">
                      {item.special_instructions
                        .split(",")
                        .map((instruction, idx) => (
                          <p key={`${instruction}-${idx}`}>
                            {instruction.split(":")[1]?.trim() || instruction}
                          </p>
                        ))}
                    </div>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {order.isLast && (
        <div
          className="order-footer"
          onMouseDown={handleOrderLongPressStart}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUpOrLeave}
          onTouchCancel={handleMouseUpOrLeave}
          onContextMenu={(e) => e.preventDefault()}
        >
          {order.status === "pending" && (
            <button
              className={`all-ready-button ${
                isLongPressActive && order.status === "pending" ? "flashing" : ""
              }`}
              onClick={() => handleOrderStatus(order.id, "ready")}
            >
              {isLongPressActive && order.status === "pending" ? "Mark Pending" : "Mark Ready"}
            </button>
          )}
          {order.status === "ready" && (
            <button
              className={`all-fulfilled-button ${
                isLongPressActive && order.status === "ready" ? "flashing" : ""
              }`}
              onClick={() => handleOrderStatus(order.id, "fulfilled")}
            >
              {isLongPressActive && order.status === "ready" ? "Mark Pending" : "Mark Fulfilled"}
            </button>
          )}
          {order.status === "fulfilled" && (
            <button
              className={`reverse-button ${
                isLongPressActive && order.status === "fulfilled" ? "flashing" : ""
              }`}
              onClick={() => restoreOrder(order.id)}
            >
              {isLongPressActive && order.status === "fulfilled" ? "Mark Pending" : "Reverse"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default KdsOrderBlock;
