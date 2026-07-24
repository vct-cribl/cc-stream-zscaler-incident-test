# Cribl Final-flag incident — cross-version results

**Question:** Does the Final flag in a Cribl route behave the way Cribl's documentation says?

**Answer:** ✅ **Yes** — on all 6 versions tested, the Final flag behaved as documented and the reported data-loss issue did not reproduce.

**Per version:**

- ✅ **4.14.1** (incident version) — behaves as documented
- ✅ **4.15.1** — behaves as documented
- ✅ **4.16.1** — behaves as documented
- ✅ **4.17.1** — behaves as documented
- ✅ **4.18.2** — behaves as documented
- ✅ **4.19.0** — behaves as documented

## Full detail — every scenario on every version

| Scenario | 4.14.1 | 4.15.1 | 4.16.1 | 4.17.1 | 4.18.2 | 4.19.0 |
| --- | --- | --- | --- | --- | --- | --- |
| `s1-baseline` — Control test: production alone, nothing else configured | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass |
| `s2-incident-unguarded` — The incident config: does the dev route make production lose data? | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass |
| `s3a-guard-eval` — Support's suggested fix (guard on the rename step) | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass |
| `s3b-guard-route-filter` — What happens if the guard is put in the wrong place | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass |
| `s4-sampled-unguarded` — The pre-incident state: dev sampling 1-in-10 turned ON | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass |
| `s5-guard-pack-routes` — Alternative guard placement (on the pack's internal routes) | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass |
| `s6-empty-clone-spec` — UI 'Add clone' clicked but left empty | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass |
| `s7-dual-dest` — Old dual-destination shape: two production routes instead of a router | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass |
| `s8-critical` — Critical case: sampling present but disabled, no guard anywhere | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass |

`✅ pass` = behaves as expected; `⚠️ diverge` = this version behaves differently.
