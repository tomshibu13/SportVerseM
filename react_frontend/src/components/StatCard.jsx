import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, isPositive = true, icon: Icon, color = 'gold', subtitle }) {
  const colorMap = {
    gold: { bg: 'rgba(200, 137, 91, 0.15)', border: 'rgba(200, 137, 91, 0.35)', text: '#c8895b' },
    bronze: { bg: 'rgba(167, 111, 69, 0.15)', border: 'rgba(167, 111, 69, 0.35)', text: '#a76f45' },
    emerald: { bg: 'rgba(200, 137, 91, 0.15)', border: 'rgba(200, 137, 91, 0.35)', text: '#c8895b' },
    cyan: { bg: 'rgba(229, 186, 147, 0.15)', border: 'rgba(229, 186, 147, 0.35)', text: '#e5ba93' },
    violet: { bg: 'rgba(200, 137, 91, 0.15)', border: 'rgba(200, 137, 91, 0.35)', text: '#c8895b' },
    amber: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', text: '#f59e0b' },
  };

  const scheme = colorMap[color] || colorMap.gold;

  return (
    <div className="glass-card glass-card-interactive" style={styles.card}>
      <div style={styles.topRow}>
        <span style={styles.title}>{title}</span>
        <div style={{ ...styles.iconWrapper, background: scheme.bg, borderColor: scheme.border }}>
          {Icon && <Icon size={20} color={scheme.text} />}
        </div>
      </div>
      
      <div style={styles.valueRow}>
        <h3 style={styles.value}>{value}</h3>
      </div>

      <div style={styles.bottomRow}>
        {change && (
          <div style={{ ...styles.changeBadge, color: isPositive ? '#e5ba93' : '#f87171' }}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{change}</span>
          </div>
        )}
        {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '135px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '0.825rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  iconWrapper: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    margin: '0.6rem 0 0.4rem 0',
  },
  value: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.03em',
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  changeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem',
    fontSize: '0.775rem',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
  }
};
