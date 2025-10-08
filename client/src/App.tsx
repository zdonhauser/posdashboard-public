import React, {
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import { Route, Routes, Link, useNavigate } from "react-router-dom";
import POSWindow from "./components/POSWindow/POSWindow";
import DeviceLock from "./DeviceLock";
import Login from "./components/Login/Login";
import ClockIn from "./components/ClockIn/ClockIn";
import Groups from "./components/Groups/Groups";
import KDS from "./components/KDS/KDS";
import Party from "./components/Party/Party";
import Parties from "./components/Parties/Parties";
import DailyReports from "./components/DailyReports/DailyReports";
import DailyDashboard from "./components/DailyDashboard/DailyDashboard";
import RegisterReports from "./components/DailyReports/RegisterReports";
import EmployeeTable from "./components/EmployeeTable/EmployeeTable";
import EmployeeHours from "./components/EmployeeTable/EmployeeHours";
import GiftCardTable from "./components/GiftCardTable/GiftCardTable";
import MembershipVisitsTable from "./components/MembershipVisitsTable/MembershipVisitsTable";
import MembersTable from "./components/MembersTable/MembersTable";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import "./App.scss";
import bookImg from "./images/book.png";
import settingsPNG from "./images/settings.png";
import reportsPNG from "./images/reports.png";
import plus from "./images/bookPlus.png";
import giftcard from "./images/giftcard.png";
import KDSImg from "./images/kds.png";
import recall from "./images/recall.png";
import pickupImg from "./images/pickup.png";
import logout from "./images/logout.png";
import pos from "./images/pos.png";
import menu from "./images/menu.png";
import member from "./images/members.png";
import member_visits from "./images/member_visits.png";
import employees from "./images/employees.png";
import { useIdleTimer } from "react-idle-timer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Settings from "./components/Settings/settings";
import { storeDirectoryHandle, getDirectoryHandle } from "./indexedDBUtils";
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "pk_live_nrgG07O8aeKT6eajUXDAkwil"
);

import { User } from "./components/POSWindow/POSTypes";

export const UserContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
}>({
  user: null,
  setUser: () => {
    throw new Error('setUser must be used within UserProvider');
  },
});

export const DemoContext = createContext<{
  isDemo: boolean;
  setIsDemo: (value: boolean | null) => void;
}>({
  isDemo: false,
  setIsDemo: () => {
    throw new Error('setIsDemo must be used within UserProvider');
  },
})

export const useUser = () => useContext(UserContext);
export const useDemo = () => useContext(DemoContext);

const bffDays = [
  new Date("2025-01-18T12:00:00Z"),
  new Date("2025-02-01T12:00:00Z"),
  new Date("2025-03-30T12:00:00Z"),
  new Date("2025-04-18T12:00:00Z"),
  new Date("2025-05-26T12:00:00Z"),
  new Date("2025-06-05T12:00:00Z"),
  new Date("2025-06-13T12:00:00Z"),
  new Date("2025-06-23T12:00:00Z"),
  new Date("2025-07-04T12:00:00Z"),
  new Date("2025-07-10T12:00:00Z"),
  new Date("2025-07-21T12:00:00Z"),
  new Date("2025-08-01T12:00:00Z"),
  new Date("2025-08-24T12:00:00Z"),
  new Date("2025-09-01T12:00:00Z"),
];

export default function App(): React.JSX.Element {
  const getUserFromSessionStorage = (): User | null => {
    const savedUser = sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  };

  const [user, setUser] = useState<User | null>(getUserFromSessionStorage());
  const [isDemo, setIsDemoState] = useState<boolean>(() => {
    const savedDemo = localStorage.getItem("demoMode");
    return savedDemo === "true";
  });

  const setIsDemo = (value: boolean) => {
    setIsDemoState(value);
    localStorage.setItem("demoMode", value.toString());
  };

  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [isBFF, setIsBFF] = useState(false);
  const [view, setView] = useState<"login" | "clockin">("login");
  const isElectron = !!window.electronAPI;
  const [clockinOnly, setClockinOnly] = useState<boolean>(false);
  const [startupPath, setStartupPath] = useState<string>("");


//if path contains #, save the path to state
useEffect(() => {
  const path = window.location.hash;
  if (path) {
    setStartupPath(path.substring(1));
  }
}, []);

useEffect(() => {
  if (user && startupPath) {
    navigate(`/${startupPath}`, { replace: true });
  }
}, [user, startupPath]);

  useEffect(() => {
    if (window.electronAPI) {
      const getClockinOnlyMode = async () => {
        const mode = await window.electronAPI.getClockinOnlyMode();
        setClockinOnly(mode);
      };
      getClockinOnlyMode();
    }
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date();
    const isBFFDay = bffDays.some(
      (bffDay) =>
        bffDay.getDate() === today.getDate() &&
        bffDay.getMonth() === today.getMonth() &&
        bffDay.getFullYear() === today.getFullYear()
    );
    setIsBFF(isBFFDay);
  }, [user]);

  useEffect(() => {
    if (!directoryHandle) {
      restoreDirectoryAccess();
    }
  }, [directoryHandle]); // Dependency on directoryHandle to avoid loop

  useEffect(() => {
    if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("user");
    }
  }, [user]);

  //add event listener to handle tab button being pressed
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      if (key === "Tab" && !user) {
        // Handle Tab key immediately
        event.preventDefault();
        setView((prevView) => (prevView === "login" ? "clockin" : "login"));
      }
    };

    // Attach event listeners
    window.addEventListener("keydown", handleKeyDown);

    // Clean up listeners on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [user]);

  const handleDirectorySelected = async () => {
    if (isElectron) {
      try {
        // Use Electron dialog to select directory
        const directoryPath = await window.electronAPI.selectDirectory();
        if (directoryPath) {
          // Store the selected directory path
          setDirectoryHandle(directoryPath); // Assuming setDirectoryHandle can now work with paths in Electron context
        }
      } catch (error) {
        console.error("Error selecting directory in Electron:", error);
      }
    } else {
      try {
        const permissionDescriptor = { mode: "read" };
        if (
          (await directoryHandle.requestPermission(permissionDescriptor)) ===
          "granted"
        ) {
          await storeDirectoryHandle(directoryHandle);
        }
      } catch (error) {
        //$1("error getting directory handle");
      }
    }
  };

  const restoreDirectoryAccess = async () => {
    if (isElectron) {
      try {
        const directoryPath = await window.electronAPI.getStoredDirectoryPath();
        if (directoryPath) {
          // Optionally check if directory is accessible (might involve trying to read it)
          setDirectoryHandle(directoryPath); // Update to handle paths in Electron context
        } else {
          //$1("No directory path found in storage");
        }
      } catch (error) {
        console.error("Error restoring directory access in Electron:", error);
      }
    } else {
      try {
        const handle = await getDirectoryHandle();
        if (handle) {
          const permission = await handle.queryPermission({ mode: "read" });
          if (permission === "granted") {
            setDirectoryHandle(handle);
          } else {
            const requestedPermission = await handle.requestPermission({
              mode: "read",
            });
            if (requestedPermission === "granted") {
              setDirectoryHandle(handle);
            } else {
              setDirectoryHandle(null);
            }
          }
        } else {
          //$1("No directory handle found in IndexedDB");
        }
      } catch (error) {
        console.error("Error restoring directory access:", error);
      }
    }
  };

  const signout = (): void => {
    setUser(null);
    sessionStorage.removeItem("token");
    navigate("/"); // Redirect to the base path
  };

  const handleOnIdle = (event: Event): void => {
    if (user && (user as User).name) {
      signout();
    }
  };

  const handleOnActive = (event: Event): void => {
    //console.log('user is active', event);
    //console.log('time remaining', getRemainingTime());
  };

  const { getRemainingTime, getLastActiveTime } = useIdleTimer({
    timeout: 1000 * 60 * 60 * 3,
    onIdle: handleOnIdle,
    debounce: 500,
    onActive: handleOnActive,
  });

  const checkAuth = (type: string): boolean => {
    //console.log('check type match between',type,user?.auth)
    if (user && (user as User).auth.includes("admin")) {
      return true;
    } else if (user && (user as User).auth.includes(type)) {
      //console.log('match!')
      return true;
    } else {
      //console.log('nope...')
      return false;
    }
  };

  const displayAuth = (type: string): "default" | "none" => {
    if (user && (user as User).auth.includes("admin")) {
      return "default";
    } else if (user && !(user as User).auth.includes(type)) {
      return "none";
    } else {
      return "default";
    }
  };

  const handleMenu = (): void => {
    const navElement = document.getElementsByClassName("nav")[0];
    if (navElement.classList.contains("nav-open")) {
      navElement.classList.remove("nav-open");
      navElement.classList.add("nav-closed");
    } else {
      navElement.classList.remove("nav-closed");
      navElement.classList.add("nav-open");
    }
  };

  const closeMenu = (): void => {
    const navElement = document.getElementsByClassName("nav")[0];
    if (navElement.classList.contains("nav-open")) {
      navElement.classList.remove("nav-open");
      navElement.classList.add("nav-closed");
    }
  };

  const OpenMenu = (): React.JSX.Element => {
    //console.log('opening the menu!', document.getElementsByClassName("nav")[0]);
    setTimeout(() => {
      //console.log('opening the menu!', document.getElementsByClassName("nav")[0]);
      if (
        document.getElementsByClassName("nav")[0].classList.contains("nav-open")
      ) {
        //
      } else {
        document
          .getElementsByClassName("nav")[0]
          .classList.remove("nav-closed");
        document.getElementsByClassName("nav")[0].classList.add("nav-open");
      }
    }, 50);

    return <div></div>;
  };

  if (user && (user as User).name) {
    return (
      <DemoContext.Provider value={{ isDemo, setIsDemo }}>
        <UserContext.Provider value={{ user, setUser }}>
          <DeviceLock>
            <div className="app">
            <Elements stripe={stripePromise}>
              <div className="nav no-print nav-closed">
                <span className="navlink">
                  <span onClick={handleMenu}>
                    <img src={menu} height="25" alt="" />
                    <span className="navtext">Menu</span>
                  </span>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.position === 'Front' ? "default" : "none" }}
                >
                  <Link to="pos" onClick={closeMenu}>
                    <img src={pos} height="25" alt="" />
                    <span className="navtext">Point of Sale</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.position === 'Front' || user.position === 'Kitchen' ? "default" : "none" }}
                >
                  <Link to="pos-kitchen" onClick={closeMenu}>
                    <img src={pos} height="25" alt="" />
                    <span className="navtext">Kitchen Point of Sale</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.manager ? "default" : "none" }}
                >
                  <Link to="parties" onClick={closeMenu}>
                    <img src={bookImg} height="25" alt="" />
                    <span className="navtext">View Party Book</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.manager ? "default" : "none" }}
                >
                  <Link to="party" onClick={closeMenu}>
                    <img src={plus} height="25" alt="" />
                    <span className="navtext">Book a Party</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.manager ? "default" : "none" }}
                >
                  <Link to="groups" onClick={closeMenu}>
                    <img src={plus} height="25" alt="" />
                    <span className="navtext">Book a Group</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.manager ? "default" : "none" }}
                >
                  <Link to="daily-reports" onClick={closeMenu}>
                    <img src={reportsPNG} height="25" alt="" />
                    <span className="navtext">Daily Reports</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.manager ? "default" : "none" }}
                >
                  <Link to="register-reports" onClick={closeMenu}>
                    <img src={reportsPNG} height="25" alt="" />
                    <span className="navtext">Register Reports</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.manager ? "default" : "none" }}
                >
                  <Link to="daily-dashboard" onClick={closeMenu}>
                    <img src={reportsPNG} height="25" alt="" />
                    <span className="navtext">Daily Dashboard</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.manager ? "default" : "none" }}
                >
                  <Link to="employees" onClick={closeMenu}>
                    <img src={employees} height="25" alt="" />
                    <span className="navtext">Employees</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.manager ? "default" : "none" }}
                >
                  <Link to="employeehours" onClick={closeMenu}>
                    <img src={employees} height="25" alt="" />
                    <span className="navtext">Employee Hours</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.manager ? "default" : "none" }}
                >
                  <Link to="gift-cards" onClick={closeMenu}>
                    <img src={giftcard} height="25" alt="" />
                    <span className="navtext">Gift Cards</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.manager ? "default" : "none" }}
                >
                  <Link to="members" onClick={closeMenu}>
                    <img src={member} height="25" alt="" />
                    <span className="navtext">Members</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.position === 'Kitchen' || user.position === 'Front' ? "default" : "none" }}
                >
                  <Link to="kds" onClick={closeMenu}>
                    <img src={KDSImg} height="25" alt="" />
                    <span className="navtext">Kitchen KDS</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.position === 'Kitchen' || user.position === 'Front' ? "default" : "none" }}
                >
                  <Link to="kds-pickup" onClick={closeMenu}>
                    <img src={pickupImg} height="25" alt="" />
                    <span className="navtext">Pickup KDS</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.position === 'Kitchen' || user.position === 'Front' ? "default" : "none" }}
                >
                  <Link to="kds-recall" onClick={closeMenu}>
                    <img src={recall} height="25" alt="" />
                    <span className="navtext">Recall KDS</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.manager ? "default" : "none" }}
                >
                  <Link to="visits" onClick={closeMenu}>
                    <img src={member_visits} height="25" alt="" />
                    <span className="navtext">Membership Visits</span>
                  </Link>
                </span>
                <span
                  className="navlink"
                  style={{ display: user.position === 'Front' ? "default" : "none" }}
                >
                  <Link to="settings" onClick={closeMenu}>
                    <img src={settingsPNG} height="25" alt="" />
                    <span className="navtext">Settings</span>
                  </Link>
                </span>
                
                <span className="navuser">
                  <span onClick={signout}>
                    <img src={logout} height="25" alt="" />
                    <span className="navtext">Signout</span>
                  </span>
                </span>
              </div>
              <Routes>
                <Route
                  path="pos"
                  element={
                    user.position === 'Front' ? (
                      <POSWindow
                        directoryHandle={directoryHandle}
                        isBFF={isBFF}
                        mode='front'
                      />
                    ) : user.position === 'Kitchen' ? (
                      <POSWindow
                        directoryHandle={directoryHandle}
                        isBFF={isBFF}
                        mode='kitchen'
                      />
                    ) : (
                      <OpenMenu />
                    )
                  }
                />
                <Route
                  path="pos-kitchen"
                  element={
                    user.position === 'Kitchen' || user.position === 'Front' ? (
                      <POSWindow
                        directoryHandle={directoryHandle}
                        isBFF={isBFF}
                        mode='kitchen'
                      />
                    ) : (
                      <OpenMenu />
                    )
                  }
                />
                <Route
                  path="party"
                  element={user.manager ? <Party /> : <OpenMenu />}
                />
                <Route
                  path="parties"
                  element={user.manager ? <Parties /> : <OpenMenu />}
                />
                <Route
                  path="groups"
                  element={user.manager ? <Groups /> : <OpenMenu />}
                />
                <Route
                  path="kds"
                  element={user.position === 'Kitchen' || user.position === 'Front' ? <KDS key="kitchen" mode="kitchen" /> : <OpenMenu />}
                />
                <Route
                  path="kds-pickup"
                  element={user.position === 'Kitchen' || user.position === 'Front' ? <KDS key="pickup" mode="pickup" /> : <OpenMenu />}
                />
                <Route
                  path="kds-front"
                  element={user.position === 'Front' ? <KDS mode="front" /> : <OpenMenu />}
                />
                <Route
                  path="kds-recall"
                  element={user.position === 'Front' || user.position === 'Kitchen' ? <KDS mode="recall" /> : <OpenMenu />}
                />
                <Route
                  path="daily-reports"
                  element={user.manager ? <DailyReports /> : <OpenMenu />}
                />
                <Route
                  path="daily-dashboard"
                  element={user.manager ? <DailyDashboard /> : <OpenMenu />}
                />
                <Route
                  path="register-reports"
                  element={user.manager ? <RegisterReports /> : <OpenMenu />}
                />
                <Route
                  path="employees"
                  element={user.manager ? <EmployeeTable /> : <OpenMenu />}
                />
                <Route
                  path="employeehours"
                  element={user.manager ? <EmployeeHours /> : <OpenMenu />}
                />
                <Route
                  path="gift-cards"
                  element={user.manager ? <GiftCardTable /> : <OpenMenu />}
                />
                <Route
                  path="visits"
                  element={
                    user.manager ? <MembershipVisitsTable /> : <OpenMenu />
                  }
                />
                <Route
                  path="members"
                  element={user.manager ? <MembersTable /> : <OpenMenu />}
                />
                <Route
                  path="settings"
                  element={
                    <Settings
                      isBFF={isBFF}
                      setIsBFF={setIsBFF}
                      directoryHandle={directoryHandle}
                      setDirectoryHandle={setDirectoryHandle}
                      onDirectorySelected={handleDirectorySelected}
                    />
                  }
                />
                <Route
                  path=""
                  element={
                    user.position === 'Front' ? (
                      <POSWindow
                        directoryHandle={directoryHandle}
                        isBFF={isBFF}
                        mode='front'
                      />
                    ) : user.position === 'Kitchen' ? (
                      <POSWindow
                        directoryHandle={directoryHandle}
                        isBFF={isBFF}
                        mode='kitchen'
                      />
                    ) : (
                      <OpenMenu />
                    )
                  }
                />
              </Routes>
            </Elements>
            <ToastContainer />
            </div>
          </DeviceLock>
        </UserContext.Provider>
      </DemoContext.Provider>
    );
  } else if (clockinOnly) {
    return (
      <div className="app">
        <ClockIn setView={setView} />
        <ToastContainer />
      </div>
    );
  } else {
    return (
      <DemoContext.Provider value={{ isDemo, setIsDemo }}>
        <UserContext.Provider value={{ user, setUser }}>
          <DeviceLock>
            <div className="app">
            <Routes>
              <Route
                path="login"
                element={
                  <Login
                    restoreDirectoryAccess={restoreDirectoryAccess}
                    setView={setView}
                  />
                }
              />
              <Route path="clockin" element={<ClockIn setView={setView} />} />
              <Route
                path="kds"
                element={
                  <Login
                    restoreDirectoryAccess={restoreDirectoryAccess}
                    setView={setView}
                  />
                }
              />
              <Route
                path="*"
                element={
                  view === "clockin" ? (
                    <ClockIn setView={setView} />
                  ) : (
                    <Login
                      restoreDirectoryAccess={restoreDirectoryAccess}
                      setView={setView}
                    />
                  )
                }
              />
            </Routes>
            <ToastContainer />
            </div>
          </DeviceLock>
        </UserContext.Provider>
      </DemoContext.Provider>
    );
  }
}
