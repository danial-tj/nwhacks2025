import React from "react";
import styles from "./CardPanel.module.css"; // Import the CSS Module

interface CardPanelProps {
  title: string;
  content: string;
}

const CardPanel: React.FC<CardPanelProps> = ({ title, content }) => {
  return (
    <div className={styles.cardPanel}>
      <h2>{title}</h2>
      <p>{content}</p>
    </div>
  );
};

export default CardPanel;
