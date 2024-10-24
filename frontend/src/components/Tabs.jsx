import React from "react";
import PropTypes from "prop-types";

export const Tabs = ({ activeTab, onTabChange, children }) => {
  return (
    <div>
      <div className="flex border-b">
        {React.Children.map(children, (child) => (
          <button
            onClick={() => onTabChange(child.props.id)}
            className={`mr-4 pb-2 ${activeTab === child.props.id ? "border-b-2 border-blue-600" : ""}`}
          >
            {child.props.label}
          </button>
        ))}
      </div>
    </div>
  );
};

Tabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export const Tab = () => {
  return null;
};
