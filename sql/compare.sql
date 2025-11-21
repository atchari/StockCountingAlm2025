select f0.qty as freezeQty,C0.qty as countQty,f0.* from ntf_FreezeData f0
left join ntf_Counting C0 on F0.whsId = C0.whsId 
and  ISNULL(F0.binId, 0) = ISNULL(C0.binId, 0)
and f0.sku = C0.sku
and isnull(f0.batchNo, '') = isnull(C0.batchNo, '')
where f0.whsId = 2


