import React from 'react';
import BecomeGroundOwnerModal from './BecomeGroundOwnerModal';

export default function AddGroundModal({ isOpen, onClose, onAddGround }) {
  return (
    <BecomeGroundOwnerModal
      isOpen={isOpen}
      onClose={onClose}
      onAddGround={onAddGround}
    />
  );
}
