/* Shared department unit conversion (mirrors private.dept_convert_qty_to_stock_unit). */
(function (global) {
  'use strict';

  function unitKey(unit) {
    return String(unit || '').trim().toLowerCase();
  }

  function stockUnit(product) {
    if (!product) return 'পিস';
    return String(product.stock_unit || product.unit || 'পিস').trim() || 'পিস';
  }

  function toStockUnit(qty, fromUnit, product) {
    var n = Number(qty || 0);
    if (!n) return 0;
    var from = unitKey(fromUnit);
    var stock = unitKey(stockUnit(product));
    var sale = unitKey(product && product.unit);
    var pack = product && product.pack_size != null ? Number(product.pack_size) : null;

    if (!stock) stock = from;
    if (from === stock) return n;

    if (from === 'গ্রাম' && stock === 'কেজি') return n / 1000;
    if (from === 'কেজি' && stock === 'গ্রাম') return n * 1000;
    if (from === 'মিলি' && stock === 'লিটার') return n / 1000;
    if (from === 'লিটার' && stock === 'মিলি') return n * 1000;
    if (from === 'মন' && stock === 'কেজি') return n * 40;
    if (from === 'কেজি' && stock === 'মন') return n / 40;

    if (pack > 0 && sale && from === sale) return n * pack;

    return n;
  }

  function hasStandardConversion(fromUnit, stockUnitName) {
    var from = unitKey(fromUnit);
    var stock = unitKey(stockUnitName);
    if (from === stock) return true;
    if (from === 'গ্রাম' && stock === 'কেজি') return true;
    if (from === 'কেজি' && stock === 'গ্রাম') return true;
    if (from === 'মিলি' && stock === 'লিটার') return true;
    if (from === 'লিটার' && stock === 'মিলি') return true;
    if (from === 'মন' && stock === 'কেজি') return true;
    if (from === 'কেজি' && stock === 'মন') return true;
    return false;
  }

  function needsPackSize(unit, stockUnitName) {
    return unitKey(unit) !== unitKey(stockUnitName) && !hasStandardConversion(unit, stockUnitName);
  }

  function formatQty(n) {
    var v = Number(n || 0);
    if (!isFinite(v)) return '0';
    if (Math.abs(v - Math.round(v)) < 0.0001) return String(Math.round(v));
    return v.toFixed(3).replace(/\.?0+$/, '');
  }

  function packHint(qty, product) {
    if (!product || !(Number(product.pack_size) > 0)) return '';
    var pack = Number(product.pack_size);
    var unit = String(product.unit || '').trim();
    if (!unit || unitKey(unit) === unitKey(stockUnit(product))) return '';
    var count = Number(qty || 0) / pack;
    if (!isFinite(count) || count <= 0) return '';
    var rounded = Math.abs(count - Math.round(count)) < 0.05 ? Math.round(count) : Number(count.toFixed(1));
    return '≈ ' + rounded + ' ' + unit;
  }

  function inventoryLine(qty, product) {
    var su = stockUnit(product);
    var hint = packHint(qty, product);
    return hint ? formatQty(qty) + ' ' + su + ' (' + hint + ')' : formatQty(qty) + ' ' + su;
  }

  global.DeptUnits = {
    unitKey: unitKey,
    stockUnit: stockUnit,
    toStockUnit: toStockUnit,
    hasStandardConversion: hasStandardConversion,
    needsPackSize: needsPackSize,
    formatQty: formatQty,
    packHint: packHint,
    inventoryLine: inventoryLine,
  };
})(typeof window !== 'undefined' ? window : globalThis);
