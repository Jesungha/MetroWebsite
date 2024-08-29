UPDATE Sales_Table AS s1
SET s1.acttype = (
    SELECT s2.acttype 
    FROM (SELECT * FROM Sales_Table) AS s2 
    WHERE s1.armastiid = s2.armastiid 
    AND s2.acttype != ''
    LIMIT 1
)
WHERE s1.acttype = '';


SELECT LEFT(s.itmdesc, 10), s.adddate, s.armastiid, s.acttype from Sales_Table s
WHERE (s.acttype = 'New Activation' or s.acttype= 'Upgrade') AND (s.itmdesc LIKE '%FEATURE CHANGE%' or s.itmdesc LIKE '%ACTIVATION PAYMENT%')
;