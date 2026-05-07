# QR Scanner Demo Scan Values

This file gives ready-to-use demo values based on `schema.md` sample data.

## Important: Job card scan value

The scanner validates using `jcard_id` (not `jcard_no`).

From `schema.md`, two sample job cards exist:
- `jcard_no = 4479` (type `AVSS`, wire tech `0200-00094`, terminals `1100-00413` / `1100-00504`)
- `jcard_no = 4480` (type `AVSS`, wire tech `0200-00142`, terminals `1100-00420` / `1100-00505`)

Use the actual `jcard_id` barcode from your app data for each card.  
If needed, get it with:

```sql
SELECT jcard_id, jcard_no, terminal_a, terminal_b, wire_tech, type
FROM j_cards
WHERE jcard_no IN (4479, 4480);
```

## Demo A (Should PASS)

Example using the card for `jcard_no = 4479`.

Scan in this order:

1. Job card barcode: `job:<JCARDS_ID_FOR_4479>`  
   Example: `job:1` (only if that is really the `jcard_id`)
2. Terminal barcode: `terminal:1100-00413`
3. Wire type barcode: `wireType:0200-00094`
4. Type barcode: `type:AVSS`

Expected result:
- Verification passes
- Job moves forward using existing stage logic

## Demo B (Should FAIL intentionally)

Use the same job card as Demo A, but change one scanned value.

Scan in this order:

1. Job card barcode: `job:<JCARDS_ID_FOR_4479>`
2. Terminal barcode: `terminal:1100-00413`
3. Wire type barcode: `wireType:0200-00142`  (wrong on purpose)
4. Type barcode: `type:AVSS`

Expected result:
- Verification fails
- Error message includes mismatch (wire type)
- Job does not advance

## Can I use internet barcode generators?

Yes. Any generator that supports common formats (like Code 128 or QR) is fine for this demo.

Practical tips:
- Encode exactly the text payloads above (including prefixes like `job:` / `terminal:`).
- Use high contrast, clean print/screen, and enough size for phone camera focus.
- If a scan is flaky, try Code 128 first or enlarge the code.
