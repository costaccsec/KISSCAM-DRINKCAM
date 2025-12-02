import React from 'react';
import { Heart, Beer, Sparkles } from 'lucide-react';
import { AppMode } from '../types';

interface CamOverlayProps {
  label?: string;
  active?: boolean;
  mode: AppMode;
}

