import React, { useState, useCallback, useEffect } from 'react';
import Numpad from '../Numpad/Numpad';
import './Login.scss';
import useEventListener from '../EventListener/EventListener';
import { toast } from "react-toastify";
import { User } from "../POSWindow/POSTypes";
import { useUser } from '../../App';

interface LoginProps {
    restoreDirectoryAccess: () => void;
    setView: (view: "login" | "clockin") => void;
}

const Login: React.FC<LoginProps> = ({ restoreDirectoryAccess, setView }) => {
    const { setUser } = useUser();
    const [typedValue, setTypedValue] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const checkPin = async () => {
        try {
            const response = await fetch(`/api/employee/${typedValue}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.id && data.token) {
                toast.success(`Logged in as ${data.firstname}`, {
                    position: toast.POSITION.TOP_RIGHT,
                });
                sessionStorage.setItem('token', data.token);
                setUser({
                    name: data.firstname,
                    firstname: data.firstname,
                    lastname: data.lastname,
                    middlename: data.middlename,
                    nickname: data.nickname,
                    id: data.id,
                    pin: typedValue,
                    admin: data.admin,
                    manager: data.manager,
                    front: data.front,
                    kitchen: data.kitchen,
                    position: data.position,
                    email: data.email
                });
                setTypedValue('');
                setErrorMessage('');
                restoreDirectoryAccess();
            } else {
                setTypedValue('');
                setErrorMessage(data.error || 'An error occurred.');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        if(typedValue == "....") {
            setView("clockin");
          } else if (typedValue.length >= 4) {
            checkPin();
        }
    }, [typedValue.length, setView]);

    const handler = useCallback(
        (event: KeyboardEvent) => {
          const num = event.key;
      
          // Handle numeric input and actions
          if (num >= "0" && num <= "9") {
            setTypedValue((prevValue) => prevValue + num);
          } else if (num === "Backspace") {
            setTypedValue((prevValue) => prevValue.slice(0, -1));
          } else if (num === "Escape") {
            setTypedValue("");
          }
      
          // Map numpad keys when Num Lock is off
          const numpadMap: Record<string, string> = {
            Home: "7",
            ArrowUp: "8",
            PageUp: "9",
            ArrowLeft: "4",
            Clear: "5",
            ArrowRight: "6",
            End: "1",
            ArrowDown: "2",
            PageDown: "3",
            Insert: "0",
            Delete: ".",
          };
          if (numpadMap[num]) {
            setTypedValue((prevValue) => prevValue + numpadMap[num]);
          }
        },
        [setTypedValue]
      );

    useEventListener('keyup', handler);

    useEffect(() => {
        if (window.location.href.includes('?code=')) {
            const val = window.location.href.split('?code=')[1].split('?')[0];
            const newUrl = window.location.href.split('?code=')[0];
            console.log('new url: ', newUrl);
            window.history.pushState({}, '', newUrl);
            setTypedValue(val);
        }
    }, []);

    return (
        <div className="loginwindow">
            <div className="logintitle">
                <h1>{typedValue}</h1>
                {errorMessage && <h6 className="error-message">{errorMessage}</h6>}
            </div>
            <div className="loginpad">
                <div className="numpadwrapper">
                    <Numpad setTypedValue={setTypedValue} />
                </div>
            </div>
        </div>
    );
};

export default Login;