// src/views/Settings.js
import React from "react";

export default function Settings({ settings, onChange }) {
  const sliders = [
    { label: "Brightness", key: "brightness" },
    { label: "Contrast", key: "contrast" },
    { label: "Saturation", key: "saturation" },
    { label: "Temperature", key: "temperature" },
  ];

  return (
    <div className="settings-panel">
      {sliders.map(({ label, key }) => {
        const sliderId = `slider-${key}`;
        return (
          <div
            className="d-flex align-items-center mb-3"
            key={key}
            style={{ gap: "1rem" }}
          >
            {/* Label */}
            <label htmlFor={sliderId} style={{ width: "100px", fontWeight: "500" }}>
              {label}
            </label>

            {/* Slider */}
            <input
              id={sliderId}
              type="range"
              min={-100}
              max={100}
              step={1}
              value={settings[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              style={{ flexGrow: 1 }}
            />

            {/* Value */}
            <div style={{ width: "40px", textAlign: "right" }}>{settings[key]}</div>
          </div>
        );
      })}
    </div>
  );
}