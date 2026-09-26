import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;
  return <span className={`badge badge-${status}`}>{status}</span>;
};
