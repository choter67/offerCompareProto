import React from "react";
import { Offer } from "@shared/schema";

interface OfferDiffProps {
  originalOffer: Offer;
  newOffer: Offer;
}

// Helper function to format monetary values
const formatMoney = (value: string | number | null): string => {
  if (value === null || value === undefined) return '$0';
  return '$' + Number(value).toLocaleString();
};

// Helper function to format contingencies
const formatContingencies = (contingencies: string[] | null): string => {
  if (!contingencies || contingencies.length === 0) return 'None';
  return contingencies.join(', ');
};

export default function OfferDiff({ originalOffer, newOffer }: OfferDiffProps) {
  // Define the fields we want to compare
  const fieldsToCompare = [
    { 
      label: 'Price', 
      original: formatMoney(originalOffer.price), 
      new: formatMoney(newOffer.price),
      changed: Number(originalOffer.price) !== Number(newOffer.price)
    },
    { 
      label: 'Net Proceeds', 
      original: formatMoney(originalOffer.netProceeds), 
      new: formatMoney(newOffer.netProceeds),
      changed: Number(originalOffer.netProceeds) !== Number(newOffer.netProceeds)
    },
    { 
      label: 'Agent Commission', 
      original: formatMoney(originalOffer.agentCommission), 
      new: formatMoney(newOffer.agentCommission),
      changed: Number(originalOffer.agentCommission) !== Number(newOffer.agentCommission)
    },
    { 
      label: 'Closing Timeline', 
      original: `${originalOffer.closingTimelineDays} days`, 
      new: `${newOffer.closingTimelineDays} days`,
      changed: originalOffer.closingTimelineDays !== newOffer.closingTimelineDays
    },
    { 
      label: 'Contingencies', 
      original: formatContingencies(originalOffer.contingencies as string[]), 
      new: formatContingencies(newOffer.contingencies as string[]),
      changed: JSON.stringify(originalOffer.contingencies) !== JSON.stringify(newOffer.contingencies)
    },
    { 
      label: 'Notes', 
      original: originalOffer.notes || 'None', 
      new: newOffer.notes || 'None',
      changed: originalOffer.notes !== newOffer.notes
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 mb-2 font-medium text-neutral-500">
        <div>Field</div>
        <div>Original Offer</div>
        <div>Counter Offer</div>
      </div>
      
      <div className="space-y-2">
        {fieldsToCompare.map((field, index) => (
          <div 
            key={index} 
            className={`grid grid-cols-3 gap-4 p-3 rounded ${field.changed ? 'bg-yellow-50 border border-yellow-200' : 'border'}`}
          >
            <div className="font-medium">{field.label}</div>
            <div className={field.changed ? 'line-through text-neutral-500' : ''}>
              {field.original}
            </div>
            <div className={field.changed ? 'font-medium text-emerald-600' : ''}>
              {field.new}
            </div>
          </div>
        ))}
      </div>
      
      {fieldsToCompare.some(f => f.changed) ? (
        <div className="p-3 bg-neutral-50 rounded border">
          <p className="text-sm text-neutral-600">
            <span className="font-medium">Summary of changes: </span>
            {fieldsToCompare.filter(f => f.changed).map((field, index, arr) => (
              <span key={index}>
                {field.label} changed from {field.original} to {field.new}
                {index < arr.length - 1 && '; '}
              </span>
            ))}
          </p>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
          <p className="text-sm text-emerald-800">
            No changes detected. The counter offer is identical to the original offer.
          </p>
        </div>
      )}
    </div>
  );
}