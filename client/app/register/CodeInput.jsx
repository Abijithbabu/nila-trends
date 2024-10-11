import React, { useEffect, useRef, useState } from "react";

export default function CodeInput({ dispatch }) {
	const [otp, setOtp] = useState(Array(6).fill(""));
	const inputRefs = useRef([]);

	const handleKeyDown = (e) => {
		if (
			!/^[0-9]{1}$/.test(e.key) &&
			e.key !== "Backspace" &&
			e.key !== "Delete" &&
			e.key !== "Tab" &&
			!e.metaKey
		) {
			e.preventDefault();
		}

		if (e.key === "Delete" || e.key === "Backspace") {
			const index = inputRefs.current.indexOf(e.target);
			if (index > 0) {
				if (otp?.[5]) {
					setOtp(prev => [...prev?.slice(0, index), ""])
				} else {
					setOtp((prevOtp) => [
						...prevOtp.slice(0, index - 1),
						"",
						...prevOtp.slice(index),
					]);
					inputRefs.current[index - 1].focus();
				}
			}
		}
	};

	const handleInput = (e) => {
		const { target } = e;
		const index = inputRefs.current.indexOf(target);
		if (target.value) {
			setOtp((prevOtp) => [
				...prevOtp.slice(0, index),
				target.value,
				...prevOtp.slice(index + 1),
			]);
			if (index < otp.length - 1) {
				inputRefs.current[index + 1].focus();
			}
		}
	};

	const handleFocus = (e) => {
		e.target.select();
	};

	const handlePaste = (e) => {
		e.preventDefault();
		const text = e.clipboardData.getData("text");
		if (!new RegExp(`^[0-9]{6}$`).test(text)) {
			return;
		}
		const digits = text.split("");
		setOtp(digits);
	};

	useEffect(() => {
		if (inputRefs?.current) {
			inputRefs.current[0].focus();
		}
	}, [])

	useEffect(() => {
		dispatch(otp)
	}, [otp])

	return (
		<div className="container">
			<div className="flex gap-2">
				{otp.map((digit, index) => (
					<input
						key={index}
						type="text"
						maxLength={1}
						value={digit}
						onChange={handleInput}
						onKeyDown={handleKeyDown}
						onFocus={handleFocus}
						onPaste={handlePaste}
						ref={(el) => (inputRefs.current[index] = el)}
						className="flex w-14 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-center text-2xl font-medium text-gray-500 outline-none focus:border-slate-400"
					/>
				))}
			</div>
			<p className="mt-1.5 text-xs text-body-color">
				6-digit verification code.
			</p>
		</div>
	);
}