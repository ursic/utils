#include <thread>
#include <vector>
#include <algorithm>
#include "tbb/concurrent_queue.h"
#include "tasks.hpp"

tbb::concurrent_queue<std::thread::id> released_threads;
std::vector<std::thread> threads;

void Threads::store_thread(std::thread t) {
    threads.push_back(move(t));
}

void release_thread(std::thread::id id) {
    released_threads.push(id);
}

/*
 * Remove all joined threads
 * from the threads vector.
 */
void Threads::remove_joined_threads() {
   threads.erase
        (remove_if(begin(threads),
                   end(threads),
                   [&](const std::thread &t) {
                       return !t.joinable();
                   }),
         end(threads));
}

/*
 * Join all yet unjoined threads in the threads vector.
 * No need to shrink the vector, since this function
 * is supposed to be called at the end of main.
 */
void Threads::join_all_threads() {
    for (auto &t : threads) {
        if (t.joinable()) {
            t.join();
        }
    }
    released_threads.clear();
}

/*
 * Join released threads and clean up the threads vector.
 * Necessary if the threads vector is filling up.
 */
void Threads::join_released_threads() {
    std::thread::id t_id;
    while(0 < released_threads.unsafe_size()) {
        if (!released_threads.try_pop(t_id)) continue;
        for (auto &t : threads) {
            if ((t_id == t.get_id()) &&
                t.joinable()) {
                t.join();
            }
        }
    }
    remove_joined_threads();
}

Threads::~Threads() {
    join_all_threads();
}
