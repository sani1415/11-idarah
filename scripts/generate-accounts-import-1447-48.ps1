param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$batch = 'accounts-1447-48-core'
$sourceFile = [System.IO.Path]::GetFileName($InputPath)
$fallbackCategory = 'খাত উল্লেখ নেই'

function Get-Number($value) {
  if ($null -eq $value -or [string]::IsNullOrWhiteSpace([string]$value)) { return $null }
  $number = 0.0
  if ([double]::TryParse([string]$value, [ref]$number)) { return $number }
  return $null
}

function Get-Text($value) {
  if ($null -eq $value) { return '' }
  return ([string]$value).Trim()
}

function Normalize-Month($value) {
  $month = Get-Text $value
  $map = @{
    'শাওয়াল' = 'শাওয়াল'
    'শাওয়াল' = 'শাওয়াল'
    'জিলকদ' = 'জিলকদ'
    'জিলকাদ' = 'জিলকদ'
    'জিলক্বাদ' = 'জিলকদ'
    'জিলহাজ' = 'জিলহজ'
    'জিলহাজ্ব' = 'জিলহজ'
    'জিলহজ' = 'জিলহজ'
    'রামাযান' = 'রমজান'
    'রমাদান' = 'রমজান'
    'রমজান' = 'রমজান'
    'মুহাররম' = 'মুহাররম'
    'সফর' = 'সফর'
    'রবিউল আঃ' = 'রবিউল আউয়াল'
    'রবিউস সানী' = 'রবিউস সানি'
    'জুমাদাল উলা' = 'জুমাদাল উলা'
    'জুমা:আখেরা' = 'জুমাদাল উখরা'
    'রজব' = 'রজব'
    'শাবান' = 'শাবান'
  }
  if ($map.ContainsKey($month)) { return $map[$month] }
  throw "Unknown Hijri month: $month"
}

function Convert-GregorianToHijri($date) {
  $ranges = @(
    @('2026-02-26', '2026-03-28', 'রমজান', 1447),
    @('2026-03-29', '2026-04-26', 'শাওয়াল', 1447),
    @('2026-04-27', '2026-05-25', 'জিলকদ', 1447),
    @('2026-05-26', '2026-06-24', 'জিলহজ', 1447)
  )
  foreach ($range in $ranges) {
    $start = [datetime]::ParseExact($range[0], 'yyyy-MM-dd', $null)
    $end = [datetime]::ParseExact($range[1], 'yyyy-MM-dd', $null)
    if ($date -ge $start -and $date -le $end) {
      return @{
        month = $range[2]
        year = [int]$range[3]
        day = [int][math]::Min(30, (($date.Date - $start.Date).TotalDays + 1))
      }
    }
  }
  throw "Gregorian date is outside the supported 1447 range: $($date.ToString('yyyy-MM-dd'))"
}

function Add-Metadata($extra) {
  $metadata = [ordered]@{ importBatch = $batch }
  foreach ($key in $extra.Keys) {
    if ($null -ne $extra[$key] -and -not [string]::IsNullOrWhiteSpace([string]$extra[$key])) {
      $metadata[$key] = $extra[$key]
    }
  }
  return $metadata
}

$excel = $null
$workbook = $null
$incomes = [System.Collections.Generic.List[object]]::new()
$expenses = [System.Collections.Generic.List[object]]::new()
$dues = [System.Collections.Generic.List[object]]::new()
$duePayments = [System.Collections.Generic.List[object]]::new()
$categories = [System.Collections.Generic.HashSet[string]]::new()

try {
  $resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $excel.AskToUpdateLinks = $false
  $excel.EnableEvents = $false
  $workbook = $excel.Workbooks.Open($resolvedInput, 0, $true)

  $incomeSheet = $workbook.Worksheets.Item('অর্থ গ্রহণ')
  for ($row = 11; $row -le 269; $row++) {
    $amount = Get-Number $incomeSheet.Range("C$row").Value2
    if ($null -eq $amount -or $amount -le 0) { continue }
    $accountLabel = Get-Text $incomeSheet.Range("E$row").Value2
    $accountMap = @{
      'মাতবাখ' = 'matbakh'
      'মাদরাসা' = 'madrasa'
      'তামিরাত' = 'tamirat'
      'তামীরাত' = 'tamirat'
    }
    if (-not $accountMap.ContainsKey($accountLabel)) {
      throw "Unknown income account at অর্থ গ্রহণ row $row`: $accountLabel"
    }
    $incomes.Add([pscustomobject][ordered]@{
      id = "xlsx-4748-inc-$('{0:D5}' -f $row)"
      account = $accountMap[$accountLabel]
      hijri_year = '1447'
      month = Normalize-Month $incomeSheet.Range("A$row").Value2
      day = [int](Get-Number $incomeSheet.Range("B$row").Value2)
      gregorian_date = $null
      amount = $amount
      note = Get-Text $incomeSheet.Range("D$row").Value2
      source_file = $sourceFile
      source_sheet = 'অর্থ গ্রহণ'
      source_row = $row
      metadata = Add-Metadata @{ originalAccountLabel = $accountLabel }
    })
  }
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($incomeSheet)

  $expenseConfigs = @(
    @{
      sheet = 'মাতবাখ'; account = 'matbakh'; start = 6; last = 3760
      month = 'A'; day = 'B'; category = 'C'; description = 'D'
      quantity = 'E'; unit = $null; unitPrice = 'F'; amount = 'G'
      supplier = 'H'; receipt = 'I'; handler = 'J'; gregorian = $null
    },
    @{
      sheet = 'মাদরাসা'; account = 'madrasa'; start = 7; last = 2438
      month = 'B'; day = 'C'; category = 'D'; description = 'E'
      quantity = 'F'; unit = $null; unitPrice = 'G'; amount = 'H'
      supplier = 'I'; receipt = 'J'; handler = $null; gregorian = $null
    },
    @{
      sheet = 'তামীরাত'; account = 'tamirat'; start = 5; last = 860
      month = $null; day = $null; category = 'B'; description = 'C'
      quantity = 'D'; unit = 'E'; unitPrice = 'F'; amount = 'G'
      supplier = 'I'; receipt = 'J'; handler = 'K'; gregorian = 'A'
    }
  )

  foreach ($config in $expenseConfigs) {
    $sheet = $workbook.Worksheets.Item($config.sheet)
    for ($row = $config.start; $row -le $config.last; $row++) {
      $amount = Get-Number $sheet.Range("$($config.amount)$row").Value2
      if ($null -eq $amount -or $amount -le 0) { continue }

      $category = Get-Text $sheet.Range("$($config.category)$row").Value2
      if ([string]::IsNullOrWhiteSpace($category)) { $category = $fallbackCategory }
      [void]$categories.Add($category)

      $gregorianDate = $null
      if ($config.gregorian) {
        $serial = Get-Number $sheet.Range("$($config.gregorian)$row").Value2
        if ($null -eq $serial) { throw "Missing Gregorian date at $($config.sheet) row $row" }
        $date = [datetime]::FromOADate($serial).Date
        $mapped = Convert-GregorianToHijri $date
        $month = $mapped.month
        $hijriYear = [string]$mapped.year
        $day = $mapped.day
        $gregorianDate = $date.ToString('yyyy-MM-dd')
      } else {
        $month = Normalize-Month $sheet.Range("$($config.month)$row").Value2
        $hijriYear = '1447'
        $day = [int](Get-Number $sheet.Range("$($config.day)$row").Value2)
      }

      $supplier = Get-Text $sheet.Range("$($config.supplier)$row").Value2
      $paymentMethod = ''
      if ($config.account -eq 'tamirat' -and $supplier -eq 'নগদ') {
        $supplier = ''
        $paymentMethod = 'cash'
      }

      $handler = if ($config.handler) { Get-Text $sheet.Range("$($config.handler)$row").Value2 } else { '' }
      $expenseId = "xlsx-4748-exp-$($config.account)-$('{0:D5}' -f $row)"
      $expenses.Add([pscustomobject][ordered]@{
        id = $expenseId
        account = $config.account
        project = if ($config.account -eq 'tamirat') { $category } else { $config.sheet }
        hijri_year = $hijriYear
        month = $month
        day = $day
        gregorian_date = $gregorianDate
        category = $category
        description = Get-Text $sheet.Range("$($config.description)$row").Value2
        quantity = Get-Number $sheet.Range("$($config.quantity)$row").Value2
        unit = if ($config.unit) { Get-Text $sheet.Range("$($config.unit)$row").Value2 } else { '' }
        unit_price = Get-Number $sheet.Range("$($config.unitPrice)$row").Value2
        amount = $amount
        supplier = $supplier
        receipt_no = Get-Text $sheet.Range("$($config.receipt)$row").Value2
        payment_method = $paymentMethod
        source_file = $sourceFile
        source_sheet = $config.sheet
        source_row = $row
        metadata = Add-Metadata @{ handledBy = $handler }
      })
    }
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($sheet)
  }

  # Opening qard receivables: these reduce cash but remain separate from regular expense.
  $variousSheet = $workbook.Worksheets.Item('বিভিন্ন স্থানে অর্থ ')
  $variousQardTotal = 0
  for ($row = 6; $row -le 26; $row++) {
    $amount = Get-Number $variousSheet.Range("C$row").Value2
    if ($null -eq $amount -or $amount -le 0) { continue }
    $serial = Get-Number $variousSheet.Range("A$row").Value2
    if ($null -eq $serial) { throw "Missing qard date at বিভিন্ন স্থানে অর্থ row $row" }
    $date = [datetime]::FromOADate($serial).Date
    $mapped = Convert-GregorianToHijri $date
    $category = Get-Text $variousSheet.Range("B$row").Value2
    if ([string]::IsNullOrWhiteSpace($category)) { $category = $fallbackCategory }
    $medium = Get-Text $variousSheet.Range("D$row").Value2
    $expenses.Add([pscustomobject][ordered]@{
      id = "xlsx-4748-qard-various-$('{0:D3}' -f $row)"
      account = 'qard'
      project = 'প্রারম্ভিক করজ'
      hijri_year = [string]$mapped.year
      month = $mapped.month
      day = $mapped.day
      gregorian_date = $date.ToString('yyyy-MM-dd')
      category = $category
      description = if ($medium) { $medium } else { 'বিভিন্ন স্থানে অর্থ — প্রারম্ভিক বকেয়া' }
      quantity = $null
      unit = ''
      unit_price = $null
      amount = $amount
      supplier = ''
      receipt_no = ''
      payment_method = 'cash'
      source_file = $sourceFile
      source_sheet = 'বিভিন্ন স্থানে অর্থ'
      source_row = $row
      metadata = Add-Metadata @{ openingQard = $true; sourceType = 'variousLocations' }
    })
    $variousQardTotal += $amount
  }
  $variousSheetTotal = Get-Number $variousSheet.Range('D2').Value2
  if ($variousQardTotal -ne $variousSheetTotal) {
    throw "Various-locations qard total mismatch: rows=$variousQardTotal summary=$variousSheetTotal"
  }
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($variousSheet)

  $houseSheet = $workbook.Worksheets.Item('বাসার হিসাব')
  $houseDeposit = Get-Number $houseSheet.Range('H2').Value2
  $houseExpense = Get-Number $houseSheet.Range('H4').Value2
  $houseBalance = Get-Number $houseSheet.Range('H6').Value2
  $houseQard = [math]::Abs($houseBalance)
  if (($houseExpense - $houseDeposit) -ne $houseQard) {
    throw "House qard mismatch: expense=$houseExpense deposit=$houseDeposit balance=$houseBalance"
  }
  $expenses.Add([pscustomobject][ordered]@{
    id = 'xlsx-4748-qard-house-balance'
    account = 'qard'
    project = 'প্রারম্ভিক করজ'
    hijri_year = '1447'
    month = 'জিলহজ'
    day = 25
    gregorian_date = $null
    category = 'বাসার হিসাব'
    description = 'অবশিষ্ট বকেয়া (মোট খরচ − মোট জমা)'
    quantity = $null
    unit = ''
    unit_price = $null
    amount = $houseQard
    supplier = ''
    receipt_no = ''
    payment_method = 'cash'
    source_file = $sourceFile
    source_sheet = 'বাসার হিসাব'
    source_row = 6
    metadata = Add-Metadata @{
      openingQard = $true
      sourceType = 'houseNetDeficit'
      totalDeposit = $houseDeposit
      totalExpense = $houseExpense
      asOf = '1447-12-25'
    }
  })
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($houseSheet)

  $dueSheet = $workbook.Worksheets.Item('বাকির হিসাব')
  $dueIdBySupplier = @{}
  for ($row = 2; $row -le 8; $row++) {
    $total = Get-Number $dueSheet.Range("D$row").Value2
    if ($null -eq $total -or $total -le 0) { continue }
    $supplier = Get-Text $dueSheet.Range("C$row").Value2
    $id = "xlsx-4748-due-general-$('{0:D3}' -f $row)"
    $dueIdBySupplier[$supplier] = @{ id = $id; account = 'general' }
    $dues.Add([pscustomobject][ordered]@{
      id = $id; account = 'general'; supplier = $supplier
      total = $total; paid = Get-Number $dueSheet.Range("E$row").Value2
      due = Get-Number $dueSheet.Range("F$row").Value2
      source_file = $sourceFile; source_sheet = 'বাকির হিসাব'; source_row = $row
      metadata = Add-Metadata @{ combinedAccounts = @('matbakh', 'madrasa') }
    })
  }
  for ($row = 2; $row -le 9; $row++) {
    $total = Get-Number $dueSheet.Range("J$row").Value2
    if ($null -eq $total -or $total -le 0) { continue }
    $supplier = Get-Text $dueSheet.Range("I$row").Value2
    $id = "xlsx-4748-due-tamirat-$('{0:D3}' -f $row)"
    $dueIdBySupplier[$supplier] = @{ id = $id; account = 'tamirat' }
    $dues.Add([pscustomobject][ordered]@{
      id = $id; account = 'tamirat'; supplier = $supplier
      total = $total; paid = Get-Number $dueSheet.Range("K$row").Value2
      due = Get-Number $dueSheet.Range("L$row").Value2
      source_file = $sourceFile; source_sheet = 'বাকির হিসাব'; source_row = $row
      metadata = Add-Metadata @{}
    })
  }
  for ($row = 12; $row -le 45; $row++) {
    $amount = Get-Number $dueSheet.Range("C$row").Value2
    if ($null -eq $amount -or $amount -le 0) { continue }
    $supplier = Get-Text $dueSheet.Range("D$row").Value2
    if (-not $dueIdBySupplier.ContainsKey($supplier)) {
      throw "No supplier balance found for payment at বাকির হিসাব row $row`: $supplier"
    }
    $serial = Get-Number $dueSheet.Range("B$row").Value2
    $date = [datetime]::FromOADate($serial).Date
    $mapped = Convert-GregorianToHijri $date
    $dueInfo = $dueIdBySupplier[$supplier]
    $duePayments.Add([pscustomobject][ordered]@{
      id = "xlsx-4748-pay-$('{0:D5}' -f $row)"
      due_id = $dueInfo.id
      account = $dueInfo.account
      supplier = $supplier
      hijri_year = [string]$mapped.year
      month = $mapped.month
      day = $mapped.day
      gregorian_date = $date.ToString('yyyy-MM-dd')
      raw_date = [string]$serial
      amount = $amount
      receipt_no = Get-Text $dueSheet.Range("E$row").Value2
      source_file = $sourceFile
      source_sheet = 'বাকির হিসাব'
      source_row = $row
      metadata = Add-Metadata @{}
    })
  }
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($dueSheet)
} finally {
  if ($workbook) { $workbook.Close($false) }
  if ($excel) { $excel.Quit() }
  if ($workbook) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) }
  if ($excel) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel) }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

$payload = [ordered]@{
  batch = $batch
  sourceFile = $sourceFile
  incomes = $incomes
  expenses = $expenses
  dues = $dues
  duePayments = $duePayments
  categories = @($categories)
}
$json = $payload | ConvertTo-Json -Depth 10 -Compress

$sqlTemplate = @'
-- Generated from __SOURCE_FILE__.
-- ONE-TIME REPLACEMENT IMPORT. Do not rerun after recording new qard recoveries.
-- Scope: core accounts plus opening qard receivables from বাসার হিসাব and বিভিন্ন স্থানে অর্থ.
-- বাসার হিসাব imports only its net deficit; its detailed expenses are not duplicated.
-- Qard replacement rule: all existing qard expenses and qard_return incomes are replaced.

begin;

alter table public.mdr_account_incomes
  drop constraint if exists mdr_account_incomes_account_check;
alter table public.mdr_account_incomes
  add constraint mdr_account_incomes_account_check
  check (account in ('matbakh', 'madrasa', 'tamirat', 'general', 'qard_return'));

alter table public.mdr_account_expenses
  drop constraint if exists mdr_account_expenses_account_check;
alter table public.mdr_account_expenses
  add constraint mdr_account_expenses_account_check
  check (account in ('matbakh', 'madrasa', 'tamirat', 'general', 'qard'));

do $import$
declare
  v_data jsonb := $accounts4748$__PAYLOAD__$accounts4748$::jsonb;
  v_batch text := v_data->>'batch';
begin
  -- This workbook is the new opening source of truth for qard.
  -- Remove both sides so old recoveries cannot reduce the replacement balance.
  delete from public.mdr_account_incomes
  where account = 'qard_return';

  delete from public.mdr_account_expenses
  where account = 'qard';

  -- Remove only the previous deterministic Excel seed and this batch.
  -- Non-qard user-entered rows use non-numeric IDs and are preserved.
  delete from public.mdr_account_due_payments
  where id ~ '^pay-[0-9]{5}$'
     or (id like 'dpay-47-%' and source_sheet = 'বাকির হিসাব')
     or metadata->>'importBatch' = v_batch;

  delete from public.mdr_account_dues
  where id ~ '^due-[0-9]{5}$'
     or (id like 'due-47-%' and source_sheet = 'বাকির হিসাব')
     or metadata->>'importBatch' = v_batch;

  -- The workbook is authoritative for these supplier/account balances.
  delete from public.mdr_account_dues d
  using jsonb_to_recordset(v_data->'dues') as x(account text, supplier text)
  where d.account = x.account
    and lower(d.supplier) = lower(x.supplier);

  delete from public.mdr_account_expenses
  where id ~ '^exp-[0-9]{5}$'
     or source_file = 'মাতবাখ-মাদরাসা-৪৭-৪৮.xlsx'
     or (id like 'exp-tm-%' and source_sheet = 'তামীরাত-খরচ')
     or metadata->>'importBatch' = v_batch;

  delete from public.mdr_account_incomes
  where id ~ '^inc-[0-9]{5}$'
     or source_file = 'মাতবাখ-মাদরাসা-৪৭-৪৮.xlsx'
     or id like 'inc-47-%'
     or metadata->>'importBatch' = v_batch;

  insert into public.mdr_account_incomes (
    id, account, hijri_year, month, day, gregorian_date, amount, note,
    source_file, source_sheet, source_row, metadata
  )
  select
    x.id, x.account, x.hijri_year, x.month, x.day, x.gregorian_date,
    x.amount, x.note, x.source_file, x.source_sheet, x.source_row, x.metadata
  from jsonb_to_recordset(v_data->'incomes') as x(
    id text, account text, hijri_year text, month text, day integer,
    gregorian_date date, amount numeric, note text, source_file text,
    source_sheet text, source_row integer, metadata jsonb
  )
  on conflict (id) do update set
    account = excluded.account,
    hijri_year = excluded.hijri_year,
    month = excluded.month,
    day = excluded.day,
    gregorian_date = excluded.gregorian_date,
    amount = excluded.amount,
    note = excluded.note,
    source_file = excluded.source_file,
    source_sheet = excluded.source_sheet,
    source_row = excluded.source_row,
    metadata = excluded.metadata,
    updated_at = now();

  insert into public.mdr_account_expenses (
    id, account, project, hijri_year, month, day, gregorian_date,
    category, description, quantity, unit, unit_price, amount, supplier,
    receipt_no, payment_method, source_file, source_sheet, source_row, metadata
  )
  select
    x.id, x.account, x.project, x.hijri_year, x.month, x.day,
    x.gregorian_date, x.category, x.description, x.quantity,
    nullif(x.unit, ''), x.unit_price, x.amount, nullif(x.supplier, ''),
    nullif(x.receipt_no, ''), nullif(x.payment_method, ''), x.source_file,
    x.source_sheet, x.source_row, x.metadata
  from jsonb_to_recordset(v_data->'expenses') as x(
    id text, account text, project text, hijri_year text, month text,
    day integer, gregorian_date date, category text, description text,
    quantity numeric, unit text, unit_price numeric, amount numeric,
    supplier text, receipt_no text, payment_method text, source_file text,
    source_sheet text, source_row integer, metadata jsonb
  )
  on conflict (id) do update set
    account = excluded.account,
    project = excluded.project,
    hijri_year = excluded.hijri_year,
    month = excluded.month,
    day = excluded.day,
    gregorian_date = excluded.gregorian_date,
    category = excluded.category,
    description = excluded.description,
    quantity = excluded.quantity,
    unit = excluded.unit,
    unit_price = excluded.unit_price,
    amount = excluded.amount,
    supplier = excluded.supplier,
    receipt_no = excluded.receipt_no,
    payment_method = excluded.payment_method,
    source_file = excluded.source_file,
    source_sheet = excluded.source_sheet,
    source_row = excluded.source_row,
    metadata = excluded.metadata,
    updated_at = now();

  insert into public.mdr_account_dues (
    id, account, supplier, total, paid, due, source_file,
    source_sheet, source_row, metadata
  )
  select
    x.id, x.account, x.supplier, x.total, x.paid, x.due,
    x.source_file, x.source_sheet, x.source_row, x.metadata
  from jsonb_to_recordset(v_data->'dues') as x(
    id text, account text, supplier text, total numeric, paid numeric,
    due numeric, source_file text, source_sheet text, source_row integer,
    metadata jsonb
  )
  on conflict (id) do update set
    account = excluded.account,
    supplier = excluded.supplier,
    total = excluded.total,
    paid = excluded.paid,
    due = excluded.due,
    source_file = excluded.source_file,
    source_sheet = excluded.source_sheet,
    source_row = excluded.source_row,
    metadata = excluded.metadata,
    updated_at = now();

  insert into public.mdr_account_due_payments (
    id, due_id, account, supplier, hijri_year, month, day,
    gregorian_date, raw_date, amount, receipt_no, source_file,
    source_sheet, source_row, metadata
  )
  select
    x.id, x.due_id, x.account, x.supplier, x.hijri_year, x.month, x.day,
    x.gregorian_date, x.raw_date, x.amount, nullif(x.receipt_no, ''),
    x.source_file, x.source_sheet, x.source_row, x.metadata
  from jsonb_to_recordset(v_data->'duePayments') as x(
    id text, due_id text, account text, supplier text, hijri_year text,
    month text, day integer, gregorian_date date, raw_date text,
    amount numeric, receipt_no text, source_file text, source_sheet text,
    source_row integer, metadata jsonb
  )
  on conflict (id) do update set
    due_id = excluded.due_id,
    account = excluded.account,
    supplier = excluded.supplier,
    hijri_year = excluded.hijri_year,
    month = excluded.month,
    day = excluded.day,
    gregorian_date = excluded.gregorian_date,
    raw_date = excluded.raw_date,
    amount = excluded.amount,
    receipt_no = excluded.receipt_no,
    source_file = excluded.source_file,
    source_sheet = excluded.source_sheet,
    source_row = excluded.source_row,
    metadata = excluded.metadata;

  insert into public.mdr_account_categories (name)
  select jsonb_array_elements_text(v_data->'categories')
  on conflict (name) do nothing;

  if (select count(*) from public.mdr_account_incomes where metadata->>'importBatch' = v_batch) <> 15 then
    raise exception 'Income import count mismatch';
  end if;
  if (select coalesce(sum(amount), 0) from public.mdr_account_incomes where metadata->>'importBatch' = v_batch) <> 5372000 then
    raise exception 'Income import total mismatch';
  end if;
  if (select count(*) from public.mdr_account_expenses where metadata->>'importBatch' = v_batch and account <> 'qard') <> 1325 then
    raise exception 'Regular expense import count mismatch';
  end if;
  if (select coalesce(sum(amount), 0) from public.mdr_account_expenses where metadata->>'importBatch' = v_batch and account <> 'qard') <> 6351789 then
    raise exception 'Regular expense import total mismatch';
  end if;
  if (select count(*) from public.mdr_account_expenses where metadata->>'importBatch' = v_batch and account = 'qard') <> 22 then
    raise exception 'Opening qard import count mismatch';
  end if;
  if (select coalesce(sum(amount), 0) from public.mdr_account_expenses where metadata->>'importBatch' = v_batch and account = 'qard') <> 200860 then
    raise exception 'Opening qard import total mismatch';
  end if;
  if exists (select 1 from public.mdr_account_incomes where account = 'qard_return') then
    raise exception 'Old qard recovery rows were not fully replaced';
  end if;
  if (select count(*) from public.mdr_account_dues where metadata->>'importBatch' = v_batch) <> 13 then
    raise exception 'Due import count mismatch';
  end if;
  if (select coalesce(sum(due), 0) from public.mdr_account_dues where metadata->>'importBatch' = v_batch) <> 733051 then
    raise exception 'Due import total mismatch';
  end if;
  if (select count(*) from public.mdr_account_due_payments where metadata->>'importBatch' = v_batch) <> 33 then
    raise exception 'Due payment import count mismatch';
  end if;
end
$import$;

commit;
'@

$sql = $sqlTemplate.Replace('__SOURCE_FILE__', $sourceFile).Replace('__PAYLOAD__', $json)
$outputDirectory = Split-Path -Parent $OutputPath
if ($outputDirectory) { [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null }
[System.IO.File]::WriteAllText($OutputPath, $sql, [System.Text.UTF8Encoding]::new($false))

$summary = [ordered]@{
  sourceFile = $sourceFile
  incomes = $incomes.Count
  incomeTotal = ($incomes | Measure-Object -Property amount -Sum).Sum
  expenses = $expenses.Count
  expenseTotal = ($expenses | Measure-Object -Property amount -Sum).Sum
  expenseByAccount = @(
    $expenses |
      Group-Object account |
      ForEach-Object {
        [ordered]@{
          account = $_.Name
          count = $_.Count
          total = ($_.Group | Measure-Object -Property amount -Sum).Sum
        }
      }
  )
  regularExpenseTotal = ($expenses | Where-Object { $_.account -ne 'qard' } | Measure-Object -Property amount -Sum).Sum
  qardRows = @($expenses | Where-Object { $_.account -eq 'qard' }).Count
  qardTotal = ($expenses | Where-Object { $_.account -eq 'qard' } | Measure-Object -Property amount -Sum).Sum
  fallbackCategoryRows = @($expenses | Where-Object { $_.category -eq $fallbackCategory }).Count
  dues = $dues.Count
  dueTotal = ($dues | Measure-Object -Property due -Sum).Sum
  duePayments = $duePayments.Count
  duePaymentTotal = ($duePayments | Measure-Object -Property amount -Sum).Sum
  outputPath = (Resolve-Path -LiteralPath $OutputPath).Path
}
$summary | ConvertTo-Json -Depth 6
