import type { Department } from '../domain/employee.js';

export interface JobProfile {
  title: string;
  /** Typical US annual base salary; other countries are derived via a pay factor. */
  baseUsd: number;
  /** Relative frequency of the role within its department. */
  weight: number;
}

export const JOB_CATALOGUE: Record<Department, readonly JobProfile[]> = {
  Engineering: [
    { title: 'Software Engineer', baseUsd: 125_000, weight: 40 },
    { title: 'Senior Software Engineer', baseUsd: 165_000, weight: 25 },
    { title: 'Staff Engineer', baseUsd: 210_000, weight: 5 },
    { title: 'Engineering Manager', baseUsd: 200_000, weight: 6 },
    { title: 'QA Engineer', baseUsd: 95_000, weight: 8 },
    { title: 'DevOps Engineer', baseUsd: 140_000, weight: 8 },
    { title: 'Data Engineer', baseUsd: 135_000, weight: 8 },
  ],
  Product: [
    { title: 'Product Manager', baseUsd: 140_000, weight: 50 },
    { title: 'Senior Product Manager', baseUsd: 175_000, weight: 30 },
    { title: 'Product Analyst', baseUsd: 95_000, weight: 15 },
    { title: 'Director of Product', baseUsd: 230_000, weight: 5 },
  ],
  Design: [
    { title: 'Product Designer', baseUsd: 115_000, weight: 55 },
    { title: 'Senior Product Designer', baseUsd: 145_000, weight: 30 },
    { title: 'UX Researcher', baseUsd: 110_000, weight: 15 },
  ],
  Sales: [
    { title: 'Account Executive', baseUsd: 95_000, weight: 40 },
    { title: 'Sales Development Representative', baseUsd: 60_000, weight: 30 },
    { title: 'Solutions Engineer', baseUsd: 130_000, weight: 15 },
    { title: 'Sales Manager', baseUsd: 140_000, weight: 15 },
  ],
  Marketing: [
    { title: 'Marketing Specialist', baseUsd: 70_000, weight: 35 },
    { title: 'Marketing Analyst', baseUsd: 80_000, weight: 20 },
    { title: 'Content Marketing Manager', baseUsd: 90_000, weight: 20 },
    { title: 'Growth Marketing Manager', baseUsd: 110_000, weight: 20 },
    { title: 'Marketing Director', baseUsd: 180_000, weight: 5 },
  ],
  'Customer Success': [
    { title: 'Customer Support Specialist', baseUsd: 50_000, weight: 45 },
    { title: 'Customer Success Manager', baseUsd: 80_000, weight: 35 },
    { title: 'Support Team Lead', baseUsd: 75_000, weight: 20 },
  ],
  Operations: [
    { title: 'Operations Analyst', baseUsd: 75_000, weight: 40 },
    { title: 'Operations Manager', baseUsd: 110_000, weight: 30 },
    { title: 'Procurement Specialist', baseUsd: 70_000, weight: 20 },
    { title: 'Business Operations Lead', baseUsd: 130_000, weight: 10 },
  ],
  Finance: [
    { title: 'Accountant', baseUsd: 75_000, weight: 35 },
    { title: 'Financial Analyst', baseUsd: 90_000, weight: 35 },
    { title: 'Finance Manager', baseUsd: 135_000, weight: 20 },
    { title: 'Financial Controller', baseUsd: 170_000, weight: 10 },
  ],
  People: [
    { title: 'Recruiter', baseUsd: 75_000, weight: 40 },
    { title: 'HR Generalist', baseUsd: 70_000, weight: 35 },
    { title: 'People Partner', baseUsd: 105_000, weight: 22 },
    { title: 'Head of People', baseUsd: 190_000, weight: 3 },
  ],
  Legal: [
    { title: 'Legal Counsel', baseUsd: 160_000, weight: 50 },
    { title: 'Paralegal', baseUsd: 70_000, weight: 45 },
    { title: 'General Counsel', baseUsd: 280_000, weight: 5 },
  ],
};

/** Approximate share of headcount per department. */
export const DEPARTMENT_WEIGHTS: Record<Department, number> = {
  Engineering: 35,
  Sales: 15,
  'Customer Success': 10,
  Operations: 8,
  Marketing: 8,
  Product: 6,
  Finance: 6,
  People: 5,
  Design: 4,
  Legal: 3,
};
